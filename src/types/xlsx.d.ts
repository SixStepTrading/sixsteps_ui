declare module 'xlsx' {
  export interface WorkSheet {}
  export interface WorkBook {
    SheetNames: string[];
    Sheets: {
      [sheet: string]: WorkSheet;
    };
  }

  export const utils: {
    sheet_to_json<T>(worksheet: WorkSheet, options?: any): T[];
    json_to_sheet<T>(data: T[], options?: any): WorkSheet;
    book_new(): WorkBook;
    book_append_sheet(workbook: WorkBook, worksheet: WorkSheet, name: string): void;
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
  
  export function writeFile(workbook: WorkBook, filename: string): void;
} 