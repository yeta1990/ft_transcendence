//Adapted from https://ferie.medium.com/how-to-pass-environment-variables-at-building-time-in-an-angular-application-using-env-files-4ae1a80383c

//using fs-extra to create botht the file and the parent folder if they doesn't exist
//using fs throws an error
const fs = require('fs-extra');
const targetPath = './src/environments/environment.ts';
require('dotenv').load();
// `environment.ts` file structure
const envConfigFile = `export const environment = {
   apiBaseUrl: '${process.env.BACKEND_IP}',
   apiUrl: '${process.env.BACKEND_IP}',
   frontendUrl: '${process.env.FRONTEND_URL}',
   clientId42: '${process.env.CLIENT_ID_42}'
};
`;
//console.log('The file `environment.ts` will be written with the following content: \n');
//console.log(envConfigFile);
//
fs.outputFile(targetPath, envConfigFile, function (err) {
   if (err) {
   	   console.log(err)
//       throw console.error(err);
   } else {
       console.log(`Angular environment.ts file generated correctly at ${targetPath} \n`);
   }
});
