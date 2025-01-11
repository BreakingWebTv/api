export type TErrorResponse = { error: string; error_description: string };

export function isErrorResponse(data: any): data is TErrorResponse {
    return typeof data.error === 'string' && typeof data.error_description === 'string';
}