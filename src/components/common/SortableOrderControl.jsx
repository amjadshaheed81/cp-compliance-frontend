import React, { useEffect, useState } from "react";

/**
 * Reusable order control for Admin-managed ordered lists.
 * - Drag handle and typed position use the same onMove(position) callback.
 * - Typed values are committed on blur or Enter.
 * - Invalid/empty values are reset to the current position.
 */
const SortableOrderControl = ({
  value,
  max,
  canEdit = false,
  dirty = false,
  onMove,
  onDragStart,
  onDragEnd,
  title = "Drag or type a position to change order",
}) => {
  const [draftValue, setDraftValue] = useState(value ?? "");

  useEffect(() => {
    setDraftValue(value ?? "");
  }, [value]);

  const commit = () => {
    const numericValue = Number(draftValue);
    const maxValue = Number(max);
    if (
      !Number.isInteger(numericValue) ||
      numericValue < 1 ||
      (Number.isFinite(maxValue) && maxValue > 0 && numericValue > maxValue)
    ) {
      setDraftValue(value ?? "");
      return;
    }

    if (numericValue !== Number(value) && typeof onMove === "function") {
      onMove(numericValue);
    } else {
      setDraftValue(value ?? "");
    }
  };

  if (!canEdit) {
    return <span>{value}</span>;
  }

  return (
    <div
      className="d-flex align-items-center gap-2"
      style={{ minWidth: "92px" }}
      title={title}
    >
      <span
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{
          cursor: "grab",
          padding: "4px 6px",
          borderRadius: "4px",
          userSelect: "none",
        }}
        aria-label="Drag to change order"
      >
        <i className="fas fa-grip-vertical" />
      </span>
      <input
        type="number"
        min="1"
        max={max}
        value={draftValue}
        aria-label="Order position"
        className={`form-control form-control-sm ${dirty ? "border-warning" : ""}`}
        style={{ width: "64px", fontWeight: 600 }}
        onChange={(e) => setDraftValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setDraftValue(value ?? "");
            e.currentTarget.blur();
          }
        }}
      />
    </div>
  );
};

export default SortableOrderControl;
