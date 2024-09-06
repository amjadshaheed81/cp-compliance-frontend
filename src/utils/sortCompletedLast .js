export const sortCompletedLast = (actions) => {
  return actions.sort((a, b) => {
    if (a.status === "Completed" && b.status !== "Completed") {
      return 1; // `a` goes after `b`
    }
    if (a.status !== "Completed" && b.status === "Completed") {
      return -1; // `b` goes after `a`
    }
    return 0; // maintain the order otherwise
  });
};
