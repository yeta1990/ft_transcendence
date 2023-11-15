import { IsString } from 'class-validator';

export class CodeDto2fa {

  @IsString()
  readonly code2fa: string;
}
