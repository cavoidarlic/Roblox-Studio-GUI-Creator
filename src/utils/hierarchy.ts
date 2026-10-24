import { RobloxElement } from '../types/roblox';

/**
 * Checks if targetId is a descendant of potentialAncestorId.
 * Used for cycle prevention during drag-and-drop reparenting.
 * Includes visited-set tracking to prevent hanging on existing cycles.
 */
export function isDescendant(
  targetId: string,
  potentialAncestorId: string,
  elements: RobloxElement[]
): boolean {
  if (!targetId || !potentialAncestorId) return false;
  if (targetId === potentialAncestorId) return true;

  const visited = new Set<string>([targetId]);
  let curr = elements.find(e => e.id === targetId);

  while (curr && curr.parentId) {
    if (curr.parentId === potentialAncestorId) {
      return true;
    }
    if (visited.has(curr.parentId)) {
      // Cycle encountered in existing hierarchy; stop search
      break;
    }
    visited.add(curr.parentId);
    curr = elements.find(e => e.id === curr?.parentId);
  }
  return false;
}

/**
 * Returns all descendant IDs of a given element recursively.
 * Uses a visited set to guarantee termination even in cyclic data.
 */
export function getAllDescendantIds(
  elementId: string,
  elements: RobloxElement[]
): string[] {
  const descendants: string[] = [];
  const queue = [elementId];
  const visited = new Set<string>([elementId]);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const directChildren = elements.filter(
      el => el.parentId === currentId && !visited.has(el.id)
    );
    for (const child of directChildren) {
      visited.add(child.id);
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
}

/**
 * Checks whether an element can be dropped onto a given target.
 * Prevents dropping onto itself or into any of its own descendants.
 */
export function canReparent(
  draggedId: string,
  targetId: string | null,
  elements: RobloxElement[]
): boolean {
  if (targetId === null) return true; // Dropping to root ScreenGui is always allowed
  if (draggedId === targetId) return false; // Cannot drop into itself
  if (isDescendant(targetId, draggedId, elements)) return false; // Cannot drop into descendant (cycle)
  return true;
}

/**
 * Checks whether multiple dragged elements can be dropped onto a target.
 */
export function canReparentAll(
  draggedIds: string[],
  targetId: string | null,
  elements: RobloxElement[]
): boolean {
  if (targetId === null) return true;
  for (const id of draggedIds) {
    if (!canReparent(id, targetId, elements)) {
      return false;
    }
  }
  return true;
}

/**
 * Sanitizes element hierarchy to strictly eliminate any self-referencing,
 * cyclic parent relationships, or references to non-existent parents.
 * Guarantees that the resulting structure is a valid DAG / tree.
 */
export function sanitizeHierarchy(elements: RobloxElement[]): RobloxElement[] {
  if (!elements || elements.length === 0) return [];

  const elementMap = new Map<string, RobloxElement>();
  elements.forEach(e => elementMap.set(e.id, e));

  return elements.map(el => {
    // 1. Missing or self-parenting: reset to null
    if (!el.parentId || el.parentId === el.id) {
      if (el.parentId !== null) {
        return { ...el, parentId: null };
      }
      return el;
    }

    // 2. Parent doesn't exist in elements: reset to null
    if (!elementMap.has(el.parentId)) {
      return { ...el, parentId: null };
    }

    // 3. Cycle detection: walk ancestors from parent
    const visited = new Set<string>([el.id]);
    let currId: string | null = el.parentId;
    let hasCycle = false;

    while (currId) {
      if (visited.has(currId)) {
        hasCycle = true;
        break;
      }
      visited.add(currId);
      const parentEl = elementMap.get(currId);
      currId = parentEl?.parentId || null;
    }

    if (hasCycle) {
      return { ...el, parentId: null };
    }

    return el;
  });
}

export type DropPosition = 'inside' | 'before' | 'after';

/**
 * Reparents and reorders elements cleanly while maintaining the hierarchy structure,
 * preserving internal subtrees when dragging groups, and preventing cycles.
 */
export function reorderAndReparent(
  elements: RobloxElement[],
  draggedIds: string[],
  targetId: string | null,
  position: DropPosition
): RobloxElement[] {
  if (!draggedIds || draggedIds.length === 0) return elements;

  const sanitized = sanitizeHierarchy(elements);

  // Filter out any draggedId that is the target or an ancestor of the target
  const validDraggedIds = draggedIds.filter(id => {
    if (id === targetId) return false;
    if (targetId && isDescendant(targetId, id, sanitized)) return false;
    return true;
  });

  if (validDraggedIds.length === 0) return sanitized;

  const targetEl = targetId ? sanitized.find(e => e.id === targetId) : null;

  let newParentId: string | null = null;
  if (position === 'inside') {
    newParentId = targetId; // null means root ScreenGui
  } else {
    newParentId = targetEl ? targetEl.parentId : null;
  }

  // Safety check: newParentId cannot be inside any of the draggedIds
  if (newParentId && validDraggedIds.includes(newParentId)) {
    return sanitized;
  }

  const draggedSet = new Set(validDraggedIds);

  // When dragging a group, only items whose parent is NOT also in the dragged group
  // should change their parent to newParentId. Internal children retain their parent.
  const updatedDraggedElements = sanitized
    .filter(el => draggedSet.has(el.id))
    .map(el => {
      const isInternalChild = el.parentId && draggedSet.has(el.parentId);
      if (isInternalChild) {
        return el;
      }
      return {
        ...el,
        parentId: newParentId
      };
    });

  const remainingElements = sanitized.filter(el => !draggedSet.has(el.id));

  let reordered: RobloxElement[];

  if (position === 'inside') {
    if (targetId === null) {
      // Put at the end of root elements
      reordered = [...remainingElements, ...updatedDraggedElements];
    } else {
      const targetIdx = remainingElements.findIndex(e => e.id === targetId);
      if (targetIdx === -1) {
        reordered = [...remainingElements, ...updatedDraggedElements];
      } else {
        const targetDescendants = new Set(getAllDescendantIds(targetId, remainingElements));
        let insertAfterIdx = targetIdx;
        for (let i = targetIdx + 1; i < remainingElements.length; i++) {
          if (targetDescendants.has(remainingElements[i].id)) {
            insertAfterIdx = i;
          }
        }
        reordered = [...remainingElements];
        reordered.splice(insertAfterIdx + 1, 0, ...updatedDraggedElements);
      }
    }
  } else if (position === 'before') {
    if (!targetEl) {
      reordered = [...updatedDraggedElements, ...remainingElements];
    } else {
      const targetIdx = remainingElements.findIndex(e => e.id === targetId);
      if (targetIdx === -1) {
        reordered = [...remainingElements, ...updatedDraggedElements];
      } else {
        reordered = [...remainingElements];
        reordered.splice(targetIdx, 0, ...updatedDraggedElements);
      }
    }
  } else {
    // 'after'
    if (!targetEl) {
      reordered = [...remainingElements, ...updatedDraggedElements];
    } else {
      const targetIdx = remainingElements.findIndex(e => e.id === targetId);
      if (targetIdx === -1) {
        reordered = [...remainingElements, ...updatedDraggedElements];
      } else {
        const targetDescendants = new Set(getAllDescendantIds(targetEl.id, remainingElements));
        let insertAfterIdx = targetIdx;
        for (let i = targetIdx + 1; i < remainingElements.length; i++) {
          if (targetDescendants.has(remainingElements[i].id)) {
            insertAfterIdx = i;
          }
        }
        reordered = [...remainingElements];
        reordered.splice(insertAfterIdx + 1, 0, ...updatedDraggedElements);
      }
    }
  }

  return sanitizeHierarchy(reordered);
}
