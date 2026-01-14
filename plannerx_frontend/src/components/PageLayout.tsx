import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type PageLayoutProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function PageLayout({
  title,
  subtitle,
  actions,
  children,
}: PageLayoutProps): JSX.Element {
  return (
    <Stack spacing={2} sx={{ height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={800} noWrap>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Stack>
  );
}