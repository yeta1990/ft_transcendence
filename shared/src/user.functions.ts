
function validateStringLength(value: string, min: number, max: number): boolean {
	return value.length <= max && value.length >= min;
}

export const validateEmail = ( email: string ) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		throw new Error('Value of the "email" field is not valid');
	}
}

export const validateLength = ( str: string, field: string, min: number, max: number) => {
	if (!validateStringLength(str, min, max)) {
		if (min === max)
			throw new Error(`Lenght of ${field} must be ${min} characters`);
		else
			throw new Error(`Lenght of ${field} must be between ${min} and ${max} characters`)
	}
}