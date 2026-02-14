'use node';

// convex/api/livekitNode.ts
import { action } from '../_generated/server';
import { AccessToken } from 'livekit-server-sdk';

export const generateLivekitToken = action(async (ctx, args: any) => {
  // If this room doesn't exist, it'll be automatically created when
  // the first participant joins
  const roomName = args.room_name ?? 'quickstart-room';

  // Participant related fields.
  // `participantIdentity` will be available as LocalParticipant.identity
  // within the livekit-client SDK
  const participantIdentity =
    args.participant_identity ?? 'quickstart-identity';
  const participantName = args.participant_name ?? 'quickstart-username';
  const participantMetadata = args.participant_metadata ?? '';
  const participantAttributes = args.participant_attributes ?? {};

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantIdentity,
      name: participantName,
      metadata: participantMetadata,
      attributes: participantAttributes,

      // Token to expire after 10 minutes
      ttl: '10m',
    },
  );
  at.addGrant({ roomJoin: true, room: roomName });

  const participantToken = await at.toJwt();

  // Return response in standard format
  return {
    server_url: process.env.LIVEKIT_URL,
    participant_token: participantToken,
  };
});
