// custom-auth.ts — one Lambda wired to all three Cognito CUSTOM_AUTH triggers.
// The social broker, having already verified the provider token, answers the
// challenge with the shared secret; this gate ensures only the broker can
// complete a social sign-in. Email/password (SRP) auth never hits this path.
import type {
  CreateAuthChallengeTriggerEvent,
  DefineAuthChallengeTriggerEvent,
  VerifyAuthChallengeResponseTriggerEvent,
} from 'aws-lambda';

type TriggerEvent =
  | DefineAuthChallengeTriggerEvent
  | CreateAuthChallengeTriggerEvent
  | VerifyAuthChallengeResponseTriggerEvent;

const CHALLENGE_SECRET = process.env.CHALLENGE_SECRET ?? '';

export const handler = async (event: TriggerEvent): Promise<TriggerEvent> => {
  switch (event.triggerSource) {
    case 'DefineAuthChallenge_Authentication': {
      const e = event as DefineAuthChallengeTriggerEvent;
      const sessions = e.request.session ?? [];
      if (sessions.length === 0) {
        e.response.issueTokens = false;
        e.response.failAuthentication = false;
        e.response.challengeName = 'CUSTOM_CHALLENGE';
      } else {
        const last = sessions[sessions.length - 1];
        const ok = last.challengeName === 'CUSTOM_CHALLENGE' && last.challengeResult === true;
        e.response.issueTokens = ok;
        e.response.failAuthentication = !ok;
      }
      return e;
    }

    case 'CreateAuthChallenge_Authentication': {
      const e = event as CreateAuthChallengeTriggerEvent;
      if (e.request.challengeName === 'CUSTOM_CHALLENGE') {
        e.response.publicChallengeParameters = {};
        e.response.privateChallengeParameters = {};
        e.response.challengeMetadata = 'SOCIAL_BROKER';
      }
      return e;
    }

    case 'VerifyAuthChallengeResponse_Authentication': {
      const e = event as VerifyAuthChallengeResponseTriggerEvent;
      e.response.answerCorrect =
        CHALLENGE_SECRET.length > 0 && e.request.challengeAnswer === CHALLENGE_SECRET;
      return e;
    }

    default:
      return event;
  }
};
