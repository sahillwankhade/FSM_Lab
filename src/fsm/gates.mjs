// gates.mjs — Combinational gate-tree logic for FSM guard expressions.
// Every guard is a tree of AND / NOT nodes (OR only for fault logic).
// evaluate() returns { value, wire } where 'wire' is the full intermediate
// wire map so the UI can render a live circuit panel.

// ─── Node constructors ────────────────────────────────────────────────

/**
 * Leaf node — reads a named boolean from the inputs object.
 * @param {string} name — key in the inputs map (e.g. "DoorClosed")
 */
export function INPUT(name) {
  return {
    type: 'INPUT',
    name,
    evaluate(inputs) {
      const value = !!inputs[name];
      return { value, wire: { label: name, type: 'INPUT', value, children: [] } };
    },
  };
}

/**
 * AND gate — true iff every child is true.
 * @param  {...object} children — gate nodes
 */
export function AND(...children) {
  return {
    type: 'AND',
    children,
    evaluate(inputs) {
      const childResults = children.map((c) => c.evaluate(inputs));
      const value = childResults.every((r) => r.value);
      return {
        value,
        wire: {
          label: 'AND',
          type: 'AND',
          value,
          children: childResults.map((r) => r.wire),
        },
      };
    },
  };
}

/**
 * NOT gate — inverts its single child.
 * @param {object} child — gate node
 */
export function NOT(child) {
  return {
    type: 'NOT',
    child,
    evaluate(inputs) {
      const childResult = child.evaluate(inputs);
      const value = !childResult.value;
      return {
        value,
        wire: {
          label: 'NOT',
          type: 'NOT',
          value,
          children: [childResult.wire],
        },
      };
    },
  };
}

/**
 * OR gate — true iff any child is true.  Used only for fault conditions.
 * @param  {...object} children — gate nodes
 */
export function OR(...children) {
  return {
    type: 'OR',
    children,
    evaluate(inputs) {
      const childResults = children.map((c) => c.evaluate(inputs));
      const value = childResults.some((r) => r.value);
      return {
        value,
        wire: {
          label: 'OR',
          type: 'OR',
          value,
          children: childResults.map((r) => r.wire),
        },
      };
    },
  };
}

// ─── Utility ───────────────────────────────────────────────────────────

/**
 * Walk a wire tree and collect the labels of INPUT leaves whose value
 * caused the overall gate output to block (evaluate to false).
 *
 * For a guard that evaluated to false, this tells the UI exactly which
 * inputs were responsible.
 *
 * @param {{ label:string, type:string, value:boolean, children:object[] }} wire
 * @returns {string[]} — input names that blocked the guard
 */
export function guardFailReasons(wire) {
  const reasons = [];

  (function walk(node) {
    if (node.type === 'INPUT') {
      // An INPUT blocks an AND chain when it's false (or true inside a NOT).
      // We report every false INPUT at the leaves since the guard failed.
      if (!node.value) {
        reasons.push(node.label);
      }
      return;
    }

    if (node.type === 'NOT') {
      // NOT inverts meaning: if NOT(child) is false, the child was true
      // when it should have been false. Report the child's label.
      const child = node.children[0];
      if (!node.value) {
        // NOT evaluated to false → child was true → that's the problem
        if (child.type === 'INPUT') {
          reasons.push(child.label + ' (should be false)');
        } else {
          walk(child);
        }
      }
      return;
    }

    // AND / OR — recurse into children that contributed to failure
    if (node.type === 'AND') {
      // AND failed because at least one child is false
      for (const child of node.children) {
        if (!child.value) walk(child);
      }
    } else if (node.type === 'OR') {
      // OR failed because every child is false
      for (const child of node.children) {
        if (!child.value) walk(child);
      }
    }
  })(wire);

  return reasons;
}
