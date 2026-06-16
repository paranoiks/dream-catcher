// Map the broker's error `code` (carried on Error.name) to friendly, in-voice copy.
export function authErrorMessage(e: unknown): string {
  const code = e instanceof Error ? e.name : '';
  switch (code) {
    case 'NotAuthorizedException':
      // The broker collapses unknown-account into this too, so we never reveal
      // whether an email is registered (see backend lib/respond.ts).
      return 'That email or word is not right.';
    case 'UserNotConfirmedException':
      return 'Your account is not yet confirmed — check your email for the code.';
    case 'UsernameExistsException':
      return 'An account with that email already exists.';
    case 'InvalidPasswordException':
      return 'That word is too weak — at least 8 characters, with upper- and lower-case and a number.';
    case 'CodeMismatchException':
      return 'That code is not right.';
    case 'ExpiredCodeException':
      return 'That code has expired — request a new one.';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
      return 'Too many attempts — wait a little, then try again.';
    case 'InvalidParameterException':
      return 'Please check the details and try again.';
    case 'NetworkError':
      return 'Could not reach the register — check your connection.';
    case 'NoAccount':
      return 'No account yet for that sign-in — sign up first.';
    case 'InvalidToken':
      return 'That sign-in could not be verified. Please try again.';
    case 'ProviderNotConfigured':
      return 'That sign-in method is not available yet.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function isUnconfirmed(e: unknown): boolean {
  return e instanceof Error && e.name === 'UserNotConfirmedException';
}
