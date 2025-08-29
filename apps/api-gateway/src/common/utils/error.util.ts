export class ErrorUtil {
  static isServiceError(error: any): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return error?.response && error?.response?.status >= 400;
  }

  static getServiceErrorMessage(error: any): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error?.response?.data?.message) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return error.response.data.message;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return error?.message || 'Internal server error';
  }

  static getServiceErrorStatus(error: any): number {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return error?.response?.status || 500;
  }
}
