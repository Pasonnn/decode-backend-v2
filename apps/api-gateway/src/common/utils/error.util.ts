export class ErrorUtil {
  static isServiceError(error: any): boolean {
    return error.response && error.response.status >= 400;
  }

  static getServiceErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    return error.message || 'Internal server error';
  }

  static getServiceErrorStatus(error: any): number {
    return error.response?.status || 500;
  }
}
