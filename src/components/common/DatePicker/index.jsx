import React, { useCallback, useEffect, useRef, useState } from "react";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import "./datepicker.css";

// Get days in month considering leap years
const getDaysInMonth = (month, year) => {
  if (!month || !year) return 31; // Default to 31 if not provided
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(monthNum) || isNaN(yearNum)) return 31;

  // Month is 1-indexed in Date constructor
  return new Date(yearNum, monthNum, 0).getDate();
};

const validateDay = (day, month, year) => {
  if (!day) return { valid: true, maxDays: 31 };

  const dayNum = parseInt(day, 10);
  if (isNaN(dayNum)) return { valid: false, maxDays: 31 };

  if (dayNum < 1) return { valid: false, maxDays: 31 };

  if (month && year) {
    const maxDays = getDaysInMonth(month, year);
    return { valid: dayNum <= maxDays, maxDays };
  } else if (month) {
    // If we have month but no year, use a non-leap year (2023) for validation
    // This ensures February shows 28 days, not 29
    const maxDays = getDaysInMonth(month, 2023);
    return { valid: dayNum <= maxDays, maxDays };
  }

  return { valid: dayNum <= 31, maxDays: 31 };
};

// Validate month
const validateMonth = (month) => {
  if (!month) return { valid: true };
  const monthNum = parseInt(month, 10);
  if (isNaN(monthNum)) return { valid: false };
  return { valid: monthNum >= 1 && monthNum <= 12 };
};

// Validate year
const validateYear = (year) => {
  if (!year) return { valid: true };
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum)) return { valid: false };
  // No limit on years - allow any valid year (past or future)
  // Just ensure it's a reasonable number (not negative, not too large to cause issues)
  return { valid: yearNum > 0 && yearNum <= 9999 };
};

// Generate suggestion based on current input
const generateSuggestion = (input) => {
  if (!input || input.trim() === "") {
    return "DD/MM/YYYY";
  }

  const digits = input.replace(/\//g, '');
  const parts = input.split('/').filter(p => p !== '');

  let suggestion = "";

  if (parts.length === 0) {
    // User just started typing
    if (digits.length === 0) {
      suggestion = "DD/MM/YYYY";
    } else if (digits.length === 1) {
      suggestion = `${digits[0]}D/MM/YYYY`;
    } else if (digits.length === 2) {
      suggestion = `${digits}/MM/YYYY`;
    }
  } else if (parts.length === 1) {
    // User typed day
    const day = parts[0];
    if (day.length === 1) {
      suggestion = `${day}D/MM/YYYY`;
    } else if (day.length === 2) {
      suggestion = `${day}/MM/YYYY`;
    } else {
      // Day is too long, might be day+month
      if (day.length > 2) {
        const dayPart = day.slice(0, 2);
        const monthPart = day.slice(2);
        if (monthPart.length === 1) {
          suggestion = `${dayPart}/${monthPart}M/YYYY`;
        } else if (monthPart.length === 2) {
          suggestion = `${dayPart}/${monthPart}/YYYY`;
        }
      }
    }
  } else if (parts.length === 2) {
    // User typed day and month
    const day = parts[0];
    const month = parts[1];
    if (month.length === 1) {
      suggestion = `${day}/${month}M/YYYY`;
    } else if (month.length === 2) {
      suggestion = `${day}/${month}/YYYY`;
    } else {
      // Month is too long, might be month+year
      if (month.length > 2) {
        const monthPart = month.slice(0, 2);
        const yearPart = month.slice(2);
        suggestion = `${day}/${monthPart}/${yearPart}YYYY`.slice(0, 10);
      }
    }
  } else if (parts.length === 3) {
    // User typed day, month, and year
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];

    if (year.length < 4) {
      const remaining = 4 - year.length;
      suggestion = `${day}/${month}/${year}${'Y'.repeat(remaining)}`;
    } else {
      // Complete date, no suggestion needed
      return "";
    }
  }

  return suggestion;
};

// Normalize date format by padding single-digit days and months
const normalizeDateFormat = (input) => {
  if (!input || input.trim() === "") {
    return input;
  }

  const parts = input.split('/').filter(p => p !== '');

  if (parts.length === 3) {
    // We have a complete date, pad day and month if needed
    let [day, month, year] = parts;

    // Pad day to 2 digits if it's a single digit (1-9)
    if (day.length === 1 && /^[1-9]$/.test(day)) {
      day = day.padStart(2, '0');
    }

    // Pad month to 2 digits if it's a single digit (1-9)
    if (month.length === 1 && /^[1-9]$/.test(month)) {
      month = month.padStart(2, '0');
    }

    return `${day}/${month}/${year}`;
  }

  return input;
};

const TdkDatePicker = ({
  value,
  onChange,
  required,
  label,
  width = "220px",
  disabled,
  minDate,
  placeholder = "DD/MM/YYYY",
}) => {
  const datePickerRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [dateValue, setDateValue] = useState(value ? new Date(value) : null);
  const [displayValue, setDisplayValue] = useState(
    value ? moment(value).format("DD/MM/YYYY") : ""
  );
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  useEffect(() => {
    if (value) {
      const newDate = new Date(value);
      setDateValue(newDate);
      setDisplayValue(moment(newDate).format("DD/MM/YYYY"));
      setError(false);
      setSuggestion("");
    } else {
      setDateValue(null);
      setDisplayValue("");
      setSuggestion("");
    }
  }, [value]);

  const validateAndUpdateDate = useCallback(() => {
    if (displayValue.trim() === "") {
      setDateValue(null);
      if (onChange) onChange(null);
      setError(false);
      setSuggestion("");
      return;
    }

    // Normalize the date format (pad single-digit days and months)
    const normalized = normalizeDateFormat(displayValue);

    // Update display value if it was normalized
    if (normalized !== displayValue) {
      setDisplayValue(normalized);
    }

    // Check if the date string looks like a complete date (has both slashes)
    const parts = normalized.split('/').filter(p => p !== '');
    if (parts.length < 3) {
      setError(true);
      return;
    }

    const [day, month, year] = parts;

    // Validate individual components
    const dayValidation = validateDay(day, month, year);
    const monthValidation = validateMonth(month);
    const yearValidation = validateYear(year);

    if (!dayValidation.valid || !monthValidation.valid || !yearValidation.valid) {
      setError(true);
      return;
    }

    // Parse the date with moment using strict mode
    const parsedDate = moment(normalized, "DD/MM/YYYY", true);

    if (parsedDate.isValid()) {
      const jsDate = parsedDate.toDate();

      // Double-check the parsed date matches input (handles invalid dates like 31/02/2024)
      const parsedDay = parsedDate.date();
      const parsedMonth = parsedDate.month() + 1; // moment months are 0-indexed
      const parsedYear = parsedDate.year();

      if (parseInt(day, 10) !== parsedDay ||
        parseInt(month, 10) !== parsedMonth ||
        parseInt(year, 10) !== parsedYear) {
        setError(true);
        return;
      }

      // Check minDate if provided
      if (minDate && jsDate < new Date(minDate)) {
        setError(true);
        return;
      }

      setDateValue(jsDate);
      setDisplayValue(moment(jsDate).format("DD/MM/YYYY")); // Reformat to ensure consistency
      setError(false);
      setSuggestion(""); // Clear suggestion when date is complete
      if (onChange) onChange(jsDate);
    } else {
      setError(true);
    }
  }, [displayValue, minDate, onChange]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        validateAndUpdateDate();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [validateAndUpdateDate]);

  const handleInputChange = (e) => {
    const input = e.target.value;

    // Allow only digits and slashes
    const cleaned = input.replace(/[^0-9/]/g, '');

    // Automatically add slashes as user types
    let formatted = cleaned;
    const digits = cleaned.replace(/\//g, '');

    if (digits.length > 2 && !formatted.includes('/')) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    if (digits.length > 4) {
      // Ensure we have the second slash in the right position
      const parts = formatted.split('/');
      if (parts.length === 2) {
        formatted = `${parts[0]}/${parts[1].slice(0, 2)}/${parts[1].slice(2)}`;
      }
    }

    // Limit to DD/MM/YYYY format length
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }

    // Prevent multiple slashes in same position
    formatted = formatted.replace(/\/+/g, '/');

    setDisplayValue(formatted);

    // Generate and show suggestion
    const newSuggestion = generateSuggestion(formatted);
    setSuggestion(newSuggestion);

    // Real-time validation as user types
    const parts = formatted.split('/').filter(p => p !== '');

    if (parts.length > 0) {
      const [day, month, year] = parts;

      // Validate day
      if (day) {
        const dayValidation = validateDay(day, month, year);
        if (!dayValidation.valid) {
          setError(true);
          return;
        }
      }

      // Validate month
      if (month) {
        const monthValidation = validateMonth(month);
        if (!monthValidation.valid) {
          setError(true);
          return;
        }
      }

      // Validate year
      if (year) {
        const yearValidation = validateYear(year);
        if (!yearValidation.valid) {
          setError(true);
          return;
        }
      }
    }

    // Clear error while typing if format looks okay
    if (error && formatted.trim() !== "") {
      // Only clear if we have valid partial input
      const parts = formatted.split('/').filter(p => p !== '');
      if (parts.length > 0) {
        const [day, month, year] = parts;
        const dayValid = !day || validateDay(day, month, year).valid;
        const monthValid = !month || validateMonth(month).valid;
        const yearValid = !year || validateYear(year).valid;

        if (dayValid && monthValid && yearValid) {
          setError(false);
        }
      }
    }

    // Try to validate as user types complete dates
    if (parts.length === 3 && parts[2].length === 4) {
      // Normalize the date format (pad single-digit days and months)
      const normalized = normalizeDateFormat(formatted);

      // Update display value with normalized format
      if (normalized !== formatted) {
        setDisplayValue(normalized);
        // Use normalized for validation
        const normalizedParts = normalized.split('/').filter(p => p !== '');
        const parsedDate = moment(normalized, "DD/MM/YYYY", false); // Use non-strict for partial validation
        if (parsedDate.isValid()) {
          const jsDate = parsedDate.toDate();

          // Verify parsed date matches input
          const parsedDay = parsedDate.date();
          const parsedMonth = parsedDate.month() + 1;
          const parsedYear = parsedDate.year();

          if (parseInt(normalizedParts[0], 10) === parsedDay &&
            parseInt(normalizedParts[1], 10) === parsedMonth &&
            parseInt(normalizedParts[2], 10) === parsedYear) {
            // Check minDate if provided
            if (!minDate || jsDate >= new Date(minDate)) {
              setDateValue(jsDate);
              setError(false);
              setSuggestion(""); // Clear suggestion when complete
              return;
            } else {
              setError(true);
              return;
            }
          } else {
            setError(true);
            return;
          }
        } else {
          setError(normalized.trim() !== ""); // Only show error if not empty
          return;
        }
      }

      // We have a complete date format, try to parse
      const parsedDate = moment(formatted, "DD/MM/YYYY", false); // Use non-strict for partial validation
      if (parsedDate.isValid()) {
        const jsDate = parsedDate.toDate();

        // Verify parsed date matches input
        const parsedDay = parsedDate.date();
        const parsedMonth = parsedDate.month() + 1;
        const parsedYear = parsedDate.year();

        if (parseInt(parts[0], 10) === parsedDay &&
          parseInt(parts[1], 10) === parsedMonth &&
          parseInt(parts[2], 10) === parsedYear) {
          // Check minDate if provided
          if (!minDate || jsDate >= new Date(minDate)) {
            setDateValue(jsDate);
            setError(false);
            setSuggestion(""); // Clear suggestion when complete
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } else {
        setError(formatted.trim() !== ""); // Only show error if not empty
      }
    }
  };

  const handleInputKeyDown = (e) => {
    // Allow navigation and editing keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
      'Home', 'End', 'Enter', 'Escape'
    ];

    if (allowedKeys.includes(e.key)) {
      return;
    }

    // Allow digits
    if (e.key >= '0' && e.key <= '9') {
      return;
    }

    // Allow slashes anywhere (let the formatting handle it)
    if (e.key === '/') {
      return;
    }

  // Prevent all other keys
    e.preventDefault();
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (!disabled) {
      inputRef.current.removeAttribute("readonly");
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    setSuggestion(""); // Clear suggestion on blur
    validateAndUpdateDate();
  };

  const handleCalendarIconClick = () => {
    if (!disabled) {
      datePickerRef.current.setOpen(true);
      inputRef.current.focus();
    }
  };

  const clearDate = (e) => {
    e.stopPropagation();
    setDateValue(null);
    setDisplayValue("");
    setError(false);
    setSuggestion("");
    if (onChange) onChange(null);
    inputRef.current.focus();
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      validateAndUpdateDate();
      inputRef.current.blur();
    }
  };

  return (
    <div
      className={`tdk-datepicker-container ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`}
      ref={containerRef}
      style={{ width }}
    >
      {label && (
        <label className="tdk-datepicker-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}

      <div className="tdk-datepicker-input-wrapper">
        <div className="tdk-datepicker-input-container">
          <div className="tdk-datepicker-input-wrapper-inner">
            <input
              ref={inputRef}
              type="text"
              className={`tdk-datepicker-input ${isFocused ? 'focused' : ''}`}
              value={displayValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onKeyPress={handleKeyPress}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={disabled}
              required={required}
              autoComplete="off"
              style={{ width: `calc(${width} - 60px)` }}
            />
            {suggestion && isFocused && !disabled && (
              <div className="tdk-datepicker-suggestion">
                {suggestion}
              </div>
            )}
          </div>

          <div className="tdk-datepicker-actions">
            {displayValue && !disabled && (
              <button
                type="button"
                className="tdk-datepicker-clear"
                onClick={clearDate}
                tabIndex={-1}
                aria-label="Clear date"
              >
                ×
              </button>
            )}

            <CalendarTodayIcon
              className={`tdk-datepicker-icon ${disabled ? 'disabled' : ''}`}
              onClick={handleCalendarIconClick}
              style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
            />
          </div>
        </div>

        {error && (
          <div className="tdk-datepicker-error">
            {(() => {
              const parts = displayValue.split('/').filter(p => p !== '');
              if (parts.length === 3) {
                const [day, month, year] = parts;
                const dayValidation = validateDay(day, month, year);
                const monthValidation = validateMonth(month);
                const yearValidation = validateYear(year);

                if (!dayValidation.valid) {
                  return `Day must be between 1 and ${dayValidation.maxDays}`;
                }
                if (!monthValidation.valid) {
                  return "Month must be between 1 and 12";
                }
                if (!yearValidation.valid) {
                  return "Please enter a valid year (1-9999)";
                }
                return "Please enter a valid date";
              }
              return "Please enter a date in DD/MM/YYYY format";
            })()}
          </div>
        )}
      </div>

      <DatePicker
        ref={datePickerRef}
        selected={dateValue}
        onChange={(date) => {
          setDateValue(date);
          setDisplayValue(date ? moment(date).format("DD/MM/YYYY") : "");
          setError(false);
          if (onChange) onChange(date);
        }}
        onCalendarClose={() => {
          if (inputRef.current) {
            inputRef.current.focus();
            // Validate after calendar selection
            setTimeout(validateAndUpdateDate, 100);
          }
        }}
        dateFormat="dd/MM/yyyy"
        customInput={<div style={{ display: 'none' }} />}
        popperClassName="custom-datepicker-popper"
        popperPlacement="bottom-start"
        minDate={minDate ? new Date(minDate) : null}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        fixedHeight
        disabled={disabled}
      />
    </div>
  );
};

export default TdkDatePicker;