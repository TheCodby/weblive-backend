import { Request } from 'express';

export const extractTokenFromHeader = (
  request: Request,
): string | undefined => {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
};
export const generateRandomUsername = (): string => {
  const adjectives = [
    'happy',
    'angry',
    'crazy',
    'funny',
    'silly',
    'fierce',
    'brave',
    'shiny',
    'jolly',
    'clever',
    'witty',
    'awesome',
    'swift',
    'energetic',
    'kind',
    'gentle',
    'vivid',
    'vibrant',
    'magnificent',
  ];

  const nouns = [
    'tiger',
    'lion',
    'unicorn',
    'dragon',
    'eagle',
    'dolphin',
    'panda',
    'koala',
    'wolf',
    'fox',
    'rabbit',
    'hawk',
    'phoenix',
    'panther',
    'butterfly',
    'zebra',
    'octopus',
    'sparrow',
    'giraffe',
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);

  return `${randomAdjective}-${randomNoun}-${randomNumber}`;
};
