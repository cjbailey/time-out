import { describe, expect, it } from "vitest";

import Time from "../types/Time";

describe("Time", () => {
  it("should be able to add two times of format hh:mm:ss.SSS", () => {
    const t1 = new Time("01:02:03.004");
    const t2 = new Time("05:06:07.008");
    const t3 = t1.add(t2);

    expect(t3.toString()).toBe("06:08:10.012");
  });

  it("should be able to subtract two times of format hh:mm:ss.SSS", () => {
    const t1 = new Time("01:02:03.004");
    const t2 = new Time("05:06:07.008");
    const t3 = t2.sub(t1);

    expect(t3.toString()).toBe("04:04:04.004");
  });

  it("should be able to add and subtract times of format hh:mm:ss.SSS", () => {
    const t1 = new Time("01:02:03.004");
    const t2 = new Time("05:06:07.008");
    const t3 = t1.add(t2).sub(t2);

    expect(t3.toString()).toBe("01:02:03.004");
  });

  it("should be able to add two times of format hh:mm:ss", () => {
    const t1 = new Time("01:02:03");
    const t2 = new Time("05:06:07");
    const t3 = t1.add(t2);

    expect(t3.toString()).toBe("06:08:10.000");
  });

  it("should be able to subtract two times of format hh:mm:ss", () => {
    const t1 = new Time("01:02:03");
    const t2 = new Time("05:06:07");
    const t3 = t2.sub(t1);

    expect(t3.toString()).toBe("04:04:04.000");
  });

  it("should be able to add and subtract times of format hh:mm:ss", () => {
    const t1 = new Time("01:02:03");
    const t2 = new Time("05:06:07");
    const t3 = t1.add(t2).sub(t2);

    expect(t3.toString()).toBe("01:02:03.000");
  });

  it("should be able to add two times of format hh:mm", () => {
    const t1 = new Time("01:02");
    const t2 = new Time("05:06");
    const t3 = t1.add(t2);

    expect(t3.toString()).toBe("06:08:00.000");
  });

  it("should be able to subtract two times of format hh:mm", () => {
    const t1 = new Time("11:42");
    const t2 = new Time("12:42");
    const t3 = t2.sub(t1);

    expect(t3.toString()).toBe("01:00:00.000");
  });

  it("should be able to add and subtract times of format hh:mm", () => {
    const t1 = new Time("01:02");
    const t2 = new Time("05:06");
    const t3 = t1.add(t2).sub(t2);

    expect(t3.toString()).toBe("01:02:00.000");
  });

  it("should format the output string correctly", () => {
    const t1 = new Time("12:42:05.123");

    expect(t1.toString()).toBe("12:42:05.123");
    expect(t1.toString("hh:mm:ss.SSS")).toBe("12:42:05.123");
    expect(t1.toString("hh:mm:ss")).toBe("12:42:05");
    expect(t1.toString("hh:mm")).toBe("12:42");
  });

  it("should throw an error if the input string is not in the correct format", () => {
    expect(() => new Time("")).toThrow();
    expect(() => new Time("aa:bb:cc.ddd")).toThrow();
    expect(() => new Time("aa:bb:azew2")).toThrow();
    expect(() => new Time("22:bb:z4.123")).toThrow();
    expect(() => new Time("1")).toThrow();
    expect(() => new Time("1:2")).toThrow();
    expect(() => new Time("1:2:3")).toThrow();
    expect(() => new Time("1:2:3.4")).toThrow();
    expect(() => new Time("1:2:3.4.5")).toThrow();
    expect(() => new Time("10:2")).toThrow();
    expect(() => new Time("10:20:3")).toThrow();
  });

  it("should be able to subtract two times which lead to a double digit negative hour", () => {
    const t1 = new Time("20:42");
    const t2 = new Time("5:42");
    const t3 = t2.sub(t1);

    expect(t3.timeInMilliseconds).toBe(-15 * 60 * 60 * 1000);
    expect(t3.toString()).toBe("-15:00:00.000");
  });

  it("should be able to subtract two times which lead to a single digit negative hour", () => {
    const t1 = new Time("20:42");
    const t2 = new Time("15:22");
    const t3 = t2.sub(t1);

    expect(t3.timeInMilliseconds).toBe((-5 * 60 - 20) * 60 * 1000);
    expect(t3.toString()).toBe("-05:20:00.000");
  });
});
