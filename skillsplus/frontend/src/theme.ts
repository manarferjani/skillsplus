// theme.ts
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  typography: {
    fontFamily: '"Montserrat", sans-serif',
    // Vous pouvez aussi personnaliser les variantes
    h5: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
  },
})

export default theme