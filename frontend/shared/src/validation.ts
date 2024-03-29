const MAX_ID_LENGTH = 10;

export class Validator {

	static isValidUserId(input: string): boolean {
		const numericRegex = /^\d+$/;
		const isValidLength = input.length >= 1 && input.length <= MAX_ID_LENGTH;
		return numericRegex.test(input) && isValidLength;
	}

	static isValid2faCode(input: string): boolean {
		const numericRegex = /^\d{6}$/;
		return numericRegex.test(input);

	}
}

