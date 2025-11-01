#!/usr/bin/env node
"use strict";

import { Readable, Transform, TransformCallback } from "node:stream";
import * as fs from "node:fs";

/**
 * Options for CSV parsing
 */
export interface CsvParseOptions {
  /** Field delimiter (default: ',') */
  delimiter?: string;
  /** Quote character (default: '"') */
  quote?: string;
  /** Newline character (default: '\n') */
  newline?: string;
  /** Treat first row as headers and return objects */
  headers?: boolean;
  /** Trim whitespace from fields */
  trim?: boolean;
  /** Skip empty lines */
  skipEmptyLines?: boolean;
}

/**
 * CSV parsing error
 */
export class CsvError extends Error {
  readonly name = "CsvError";
  readonly line: number;
  readonly column: number;

  constructor(message: string, line: number, column: number) {
    super(message);
    this.line = line;
    this.column = column;
  }
}

/**
 * Simple streaming CSV parser for Node.js
 */
export class CsvParser {
  private readonly delimiter: string;
  private readonly quote: string;
  private readonly newline: string;
  private readonly headers: boolean;
  private readonly trim: boolean;
  private readonly skipEmptyLines: boolean;

  // Parser state
  private inQuotes = false;
  private field = "";
  private row: string[] = [];
  private line = 1;
  private column = 1;
  private headersRow: string[] | null = null;

  constructor(options: CsvParseOptions = {}) {
    this.delimiter = options.delimiter || ",";
    this.quote = options.quote || '"';
    this.newline = options.newline || "\n";
    this.headers = options.headers || false;
    this.trim = options.trim || false;
    this.skipEmptyLines = options.skipEmptyLines !== false;
  }

  /**
   * Parse CSV data from a buffer
   */
  async *parseBuffer(
    buffer: Buffer,
  ): AsyncGenerator<string[] | Record<string, string>> {
    this.reset();
    yield* this.parse(Readable.from(buffer));
  }

  /**
   * Parse CSV data from a file
   */
  async *parseFile(
    filePath: string,
  ): AsyncGenerator<string[] | Record<string, string> | null> {
    this.reset();
    yield* this.parse(fs.createReadStream(filePath));
  }

  /**
   * Parse CSV data from a readable stream
   */
  async *parse(
    stream: Readable,
  ): AsyncGenerator<string[] | Record<string, string> | null> {
    this.reset();

    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      for (let i = 0; i < buffer.length; i++) {
        yield this.processByte(buffer[i]);
      }
    }

    // Emit final row if there's remaining data
    if (this.field || this.row.length > 0) {
      yield this.emitRow();
    }
  }

  /**
   * Parse CSV data using Transform stream (for high throughput)
   */
  createTransformStream(): Transform {
    return new Transform({
      objectMode: true,
      transform: (
        chunk: Buffer,
        encoding: BufferEncoding,
        callback: TransformCallback,
      ) => {
        for (let i = 0; i < chunk.length; i++) {
          try {
            const result = this.processByte(chunk[i]);
            if (result) {
              callback(null, result);
            }
          } catch (error) {
            callback(error as Error);
            return;
          }
        }
        callback();
      },
      flush: (callback: TransformCallback) => {
        try {
          const result = this.emitRow();
          if (result) {
            callback(null, result);
          } else {
            callback();
          }
        } catch (error) {
          callback(error as Error);
        }
      },
    });
  }

  /**
   * Reset parser state
   */
  private reset(): void {
    this.inQuotes = false;
    this.field = "";
    this.row = [];
    this.line = 1;
    this.column = 1;
    this.headersRow = null;
  }

  /**
   * Process a single byte and return row if complete
   */
  private async processByte(
    byte: number,
  ): Promise<string[] | Record<string, string> | null> {
    const char = String.fromCharCode(byte);

    // Handle quotes
    if (char === this.quote) {
      if (this.inQuotes && this.field.endsWith(this.quote)) {
        // Escaped quote - replace the trailing quote
        this.field = this.field.slice(0, -1) + this.quote;
        this.column++;
        return null;
      } else {
        this.inQuotes = !this.inQuotes;
        this.column++;
        return null;
      }
    }

    // Handle newline (only when not in quotes)
    if (!this.inQuotes && (char === "\n" || char === "\r")) {
      // Handle CRLF
      if (char === "\r") {
        // Peek ahead for LF
        // In a real implementation, you'd need to handle this differently
        // For simplicity, we'll just treat \r as newline
      }

      this.line++;
      const result = this.emitRow();
      this.column = 1;
      return result;
    }

    // Handle delimiter (only when not in quotes)
    if (!this.inQuotes && char === this.delimiter) {
      this.emitField();
      this.column++;
      return null;
    }

    // Regular character
    this.field += char;
    this.column++;

    return null;
  }

  /**
   * Emit current field
   */
  private emitField(): void {
    let value = this.field;
    if (this.trim) {
      value = value.trim();
    }
    this.row.push(value);
    this.field = "";
  }

  /**
   * Emit current row
   */
  private emitRow(): string[] | Record<string, string> | null {
    // Emit final field
    this.emitField();

    // Skip empty lines
    if (this.skipEmptyLines && this.row.length === 1 && this.row[0] === "") {
      this.row = [];
      return null;
    }

    // Handle headers
    if (this.headers && !this.headersRow) {
      this.headersRow = [...this.row];
      this.row = [];
      return null;
    }

    // Create output
    const output =
      this.headers && this.headersRow ? this.createObjectRow() : [...this.row];

    this.row = [];
    return output;
  }

  /**
   * Create object row from headers and values
   */
  private createObjectRow(): Record<string, string> {
    if (!this.headersRow) {
      throw new Error("Headers not set");
    }

    const obj: Record<string, string> = {};

    for (let i = 0; i < this.headersRow.length; i++) {
      obj[this.headersRow[i]] = this.row[i] || "";
    }

    return obj;
  }
}

// /**
//  * Convenience function to parse CSV file
//  */
// export async function parseCsvFile(
//   filePath: string,
//   options: CsvParseOptions = {},
// ): Promise<string[] | Record<string, string>> {
//   const parser = new CsvParser(options);
//   const results: (string[] | Record<string, string>)[] = [];

//   for await (const row of parser.parseFile(filePath)) {
//     results.push(row);
//   }

//   return results;
// }
