import * as lst from "vscode-languageserver-types";
import { DiagnosticMessage } from "../types";
import { DocumentLike } from "../";
export interface IMarkerData {
    code?: string;
    severity: number;
    message: string;
    source?: string;
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
}
export declare function getDiagnosticMarkerData(doc: DocumentLike, source: DiagnosticMessage): IMarkerData;
export declare function getMarkerDataDiagnostic(m: IMarkerData): lst.Diagnostic;
