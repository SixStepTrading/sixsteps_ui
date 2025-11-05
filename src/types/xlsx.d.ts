declare module 'xlsx' {
  export interface CellAddress {
    r: number;
    c: number;
  }

  export interface Range {
    s: CellAddress;
    e: CellAddress;
  }

  export interface CellStyle {
    font?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      color?: { rgb?: string };
    };
    border?: {
      top?: { style?: string; color?: { rgb?: string } };
      bottom?: { style?: string; color?: { rgb?: string } };
      left?: { style?: string; color?: { rgb?: string } };
      right?: { style?: string; color?: { rgb?: string } };
    };
    fill?: {
      fgColor?: { rgb?: string };
    };
    alignment?: {
      horizontal?: string;
      vertical?: string;
    };
  }

  export interface Cell {
    v: any;
    t: string;
    z?: string;
    s?: CellStyle;
  }

  export interface ColInfo {
    wch?: number; // width in characters
    wpx?: number; // width in pixels
    hidden?: boolean;
  }

  export interface AutoFilter {
    ref: string;
  }

  export interface FreezePane {
    xSplit?: number;
    ySplit?: number;
    topLeftCell?: string;
    activePane?: string;
    state?: string;
  }

  export interface SheetView {
    state?: string;
    xSplit?: number;
    ySplit?: number;
  }

  export interface WorkSheet {
    [cell: string]: Cell | any;
    '!ref'?: string;
    '!cols'?: ColInfo[];
    '!autofilter'?: AutoFilter;
    '!freeze'?: FreezePane;
    '!views'?: SheetView[];
  }
  
  export interface WorkBook {
    SheetNames: string[];
    Sheets: {
      [sheet: string]: WorkSheet;
    };
  }

  export const utils: {
    sheet_to_json<T>(worksheet: WorkSheet, options?: any): T[];
    json_to_sheet<T>(data: T[], options?: any): WorkSheet;
    sheet_to_csv(worksheet: WorkSheet, options?: any): string;
    book_new(): WorkBook;
    book_append_sheet(workbook: WorkBook, worksheet: WorkSheet, name: string): void;
    decode_range(range: string): Range;
    encode_cell(cell: CellAddress): string;
  };

  export function read(data: string | ArrayBuffer, options?: {
    type?: string;
    cellDates?: boolean;
    cellNF?: boolean;
    cellStyles?: boolean;
    cellText?: boolean;
    cellHTML?: boolean;
    dateNF?: string;
    WTF?: boolean;
    sheetStubs?: boolean;
    sheetRows?: number;
    bookDeps?: boolean;
    bookFiles?: boolean;
    bookProps?: boolean;
    bookSheets?: boolean;
    bookVBA?: boolean;
    password?: string;
  }): WorkBook;
  
  export function writeFile(workbook: WorkBook, filename: string, options?: any): void;
} 