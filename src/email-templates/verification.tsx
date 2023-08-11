import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VercelInviteUserEmailProps {
  username?: string;
  code?: string;
  language?: string;
}

const baseUrl = process.env.ORIGIN;

export const Verification: React.FC<Readonly<VercelInviteUserEmailProps>> = ({
  username = 'zenorocha',
  code = `${baseUrl}/static/vercel-user.png`,
  language = 'en',
}: VercelInviteUserEmailProps) => {
  const previewText = `Hello ${username}, please verify your email address`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Verify your email address
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {username},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              You recently signed up for an account on Weblive. To complete your
              registration, please verify your email address by clicking the
              button below.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                pX={20}
                pY={12}
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center"
                href={`${baseUrl}/${language}/verify?code=${code}`}
              >
                Verify Email Address
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              or copy and paste this URL into your browser:{' '}
              <Link
                className="text-[#000000] text-[14px] leading-[24px] underline"
                href={`${baseUrl}/${language}/verify?code=${code}`}
              >
                {`${baseUrl}/${language}/verify?code=${code}`}
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
export default Verification;
