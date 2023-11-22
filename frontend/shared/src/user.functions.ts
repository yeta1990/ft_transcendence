
function validateStringLength(value: string, min: number, max: number): boolean {
	return value.length <= max && value.length >= min;
}

function validateUserName (userName: string) {
	const UserList = ['admin', 'user', 'superuser']; //Cambiar por los nombres de usuario de la base de datos
	return ( UserList.indexOf(userName) > -1 );
  }

export class ValidationFunctions {
	ValidateEmail = ( email: string ) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new Error('Value of the "email" field is not valid');
		}
	}
	
	ValidateLength = ( str: string, field: string, min: number, max: number) => {
		if (!validateStringLength(str, min, max)) {
			if (min === max)
				throw new Error(`Lenght of ${field} must be ${min} characters`);
			else
				throw new Error(`Lenght of ${field} must be between ${min} and ${max} characters`)
		}
	}
	
	/*    The password should be a minimum of eight characters long.
	It has at least one lower case letter.
	It has at least one upper case letter.
	It has at least one number.*/
	
	PatternValidator = (value: string): boolean => {
		const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;
		return regex.test(value);
	  }
	
	static UsernameValidator = (userName: string): Promise<boolean> => {
		return new Promise((resolve) => {
		  const isValid = validateUserName(userName);
		  resolve(!isValid);
		});
	  };
}
