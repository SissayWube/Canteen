import { styled, keyframes } from '@mui/material/styles';
import { TableRow } from '@mui/material';

const pulseHighlight = keyframes`
  0% {
    background-color: rgba(25, 118, 210, 0.15);
  }
  30% {
    background-color: rgba(25, 118, 210, 0.1);
  }
  100% {
    background-color: transparent;
  }
`;

export const HighlightedTableRow = styled(TableRow)`
  &.new-order {
    animation: ${pulseHighlight} 4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    border-left: 4px solid #1976d2 !important;
  }
`;
