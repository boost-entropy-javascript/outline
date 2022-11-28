import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import PageTitle from "~/components/PageTitle";
import Text from "~/components/Text";
import useQuery from "~/hooks/useQuery";

const DesktopRedirect = () => {
  const params = useQuery();
  const token = params.get("token");
  const { t } = useTranslation();

  React.useEffect(() => {
    if (token) {
      window.location.href = `outline://${window.location.host}/auth/redirect?token=${token}`;

      // Clean the url so it's not possible to hit reload, re-using the transfer token will not work.
      window.location.search = "";
    }
  }, [token]);

  return (
    <Centered align="center" justify="center" column auto>
      <PageTitle title={`${t("Signing in")}…`} />
      <Heading centered>{t("Signing in")}…</Heading>
      <Note>
        {t(
          "You can safely close this window once the Outline desktop app has opened"
        )}
        .
      </Note>
    </Centered>
  );
};

const Note = styled(Text)`
  color: ${(props) => props.theme.textTertiary};
  text-align: center;
  font-size: 14px;
  margin-top: 8px;

  em {
    font-style: normal;
    font-weight: 500;
  }
`;

const Centered = styled(Flex)`
  user-select: none;
  width: 90vw;
  height: 100%;
  max-width: 320px;
  margin: 0 auto;
`;

export default DesktopRedirect;
