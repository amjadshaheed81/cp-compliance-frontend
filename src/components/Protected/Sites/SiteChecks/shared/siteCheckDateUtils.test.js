import {
  getUkLocalDate,
  getUkLocalDateTimeInput,
  toJavaLocalDate,
  toJavaLocalDateTime,
} from "./siteCheckDateUtils";

describe("Site Check date utilities", () => {
  test("returns the UK calendar date", () => {
    expect(getUkLocalDate(new Date("2026-07-24T12:00:00Z"))).toBe("2026-07-24");
  });

  test("returns a datetime-local value using the UK clock", () => {
    expect(getUkLocalDateTimeInput(new Date("2026-07-24T12:30:00Z"))).toBe("2026-07-24T13:30");
  });

  test("serializes LocalDateTime with T and preserves datetime-local control time", () => {
    expect(toJavaLocalDateTime("2027-02-16T01:00")).toBe("2027-02-16T01:00:00");
    expect(toJavaLocalDateTime("2027-02-16 01:00:00")).toBe("2027-02-16T01:00:00");
    expect(toJavaLocalDateTime("2027-02-16")).toBe("2027-02-16T00:00:00");
  });

  test("serializes LocalDate from date or datetime-local controls", () => {
    expect(toJavaLocalDate("2026-07-24")).toBe("2026-07-24");
    expect(toJavaLocalDate("2026-07-24T14:30")).toBe("2026-07-24");
  });
});
