import { AxiosError } from "axios"

export class RequestErrorHandler {
	/**
	 * Handle an error that occurred during requests
	 * @param error - The error to handle
	 * @returns An Error object with the error message
	 */
	protected handleError(error: unknown): Error {
		const defaultMessage = "Request failed: Unknown error occurred"

		if (this.isAxiosError(error)) {
			return new Error(
				`Request failed: ${(error.response?.data as { message?: string })?.message || error.message || defaultMessage}`
			)
		}

		if (error instanceof Error) {
			return new Error(`Request failed: ${error.message}`)
		}

		if (typeof error === "string") {
			return new Error(`Request failed: ${error}`)
		}

		return new Error(defaultMessage)
	}

	/**
	 * Check if the error is an Axios error
	 * @param error - The error to check
	 * @returns True if the error is an Axios error, false otherwise
	 */
	private isAxiosError(error: unknown): error is AxiosError {
		return (error as AxiosError).isAxiosError === true
	}
}
