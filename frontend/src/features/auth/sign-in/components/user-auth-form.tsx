import { HTMLAttributes, useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { IconBrandGoogle, IconBrandGithub } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { authAPI } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/hooks/use-toast'

type UserAuthFormProps = HTMLAttributes<HTMLDivElement>

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter your email' })
    .email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(1, {
      message: 'Please enter your password',
    })
    .min(7, {
      message: 'Password must be at least 7 characters long',
    }),
})

// Extend Window interface with Google properties
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            getDismissedReason: () => string;
            getMomentType: () => string;
          }) => void) => void;
          renderButton: (
            element: HTMLElement, 
            options?: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
            }
          ) => void;
        }
      }
    }
  }
}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setUser, setAccessToken, setRefreshToken } = useAuthStore((state) => state.auth)

  // Load Google script when component mounts
  useEffect(() => {
    // Function to initialize Google Sign-In
    const initializeGoogle = () => {
      if (window.google && window.google.accounts) {
        console.log('Initializing Google Sign-In with client ID');
        window.google.accounts.id.initialize({
          // You must replace this with your own Google client ID
          client_id: "YOUR_GOOGLE_CLIENT_ID_HERE",
          callback: handleGoogleCallback,
          auto_select: false,
        });
        
        // Render the Google Sign-In button if we have a container
        const googleButtonContainer = document.getElementById('google-signin-button');
        if (googleButtonContainer) {
          // Using hardcoded client ID - always render the button
          const hasClientId = true; // Changed from checking env variable
          if (hasClientId) {
            window.google.accounts.id.renderButton(googleButtonContainer, {
              type: 'icon',
              shape: 'circle',
              theme: 'outline',
              size: 'large',
            });
          }
        }
        
        console.log('Google Sign-In initialized successfully');
      } else {
        console.error('Google Sign-In library not loaded properly');
      }
    };

    // Create a function to check if Google is loaded
    const checkGoogleLoaded = () => {
      if (window.google && window.google.accounts) {
        initializeGoogle();
      } else {
        // Try again in 100ms
        setTimeout(checkGoogleLoaded, 100);
      }
    };
    
    // Load the Google script
    if (!document.getElementById('google-auth-script')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = 'google-auth-script';
      script.async = true;
      script.defer = true;
      script.onload = checkGoogleLoaded;
      document.body.appendChild(script);
    } else {
      // Script already exists, check if Google is loaded
      checkGoogleLoaded();
    }

    // Clean up
    return () => {
      // Remove any event listeners if needed
    };
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
    setIsLoading(true)
      setError(null)
      
      const response = await authAPI.signIn(data.email, data.password)
      
      if (response.success) {
        // Save authentication data
        setAccessToken(response.token)
        setRefreshToken(response.refreshToken)
        setUser(response.user)
        
        // Show success message
        toast({
          title: "Success!",
          description: "You have been signed in successfully.",
          variant: "default",
        })
        
        // Redirect to dashboard
        navigate({ to: '/' })
      } else {
        setError(response.message || 'Failed to sign in')
      }
    } catch (err: any) {
      console.error('Sign-in error:', err)
      setError(err.response?.data?.message || 'An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google Sign-In callback
  const handleGoogleCallback = async (response: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Parse the JWT ID token
      const payload = parseJwt(response.credential);
      
      if (payload && payload.email && payload.sub) {
        const result = await authAPI.signInWithSocial(
          payload.email,
          payload.sub,
          'google'
        );
        
        if (result.success) {
          // Save authentication data
          setAccessToken(result.token);
          setRefreshToken(result.refreshToken);
          setUser(result.user);
          
          // Show success message
          toast({
            title: "Google sign-in successful!",
            description: "You've been signed in with Google.",
            variant: "default",
          });
          
          // Redirect to dashboard
          navigate({ to: '/' });
        } else {
          setError(result.message || 'Failed to sign in with Google');
        }
      } else {
        setError('Invalid response from Google');
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.response?.data?.message || 'An error occurred during Google sign in');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Parse JWT token
  const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };
  
  // Handle GitHub OAuth callback
  const handleGitHubCallback = async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Exchange the code for an access token and user info
      // This would typically be handled by your backend
      // For this example, we'll simulate the backend call
      
      try {
        // Call your backend to handle the GitHub OAuth code exchange
        // This keeps your client_secret secure on the server
        const result = await authAPI.exchangeGitHubCode(code);
        
        if (result.success) {
          // Save authentication data
          setAccessToken(result.token);
          setRefreshToken(result.refreshToken);
          setUser(result.user);
          
          // Show success message
          toast({
            title: "GitHub sign-in successful!",
            description: "You've been signed in with GitHub.",
            variant: "default",
          });
          
          // Redirect to dashboard
          navigate({ to: '/' });
        } else {
          setError(result.message || 'Failed to sign in with GitHub');
        }
      } catch (err: any) {
        console.error('GitHub sign-in error:', err);
        setError(err.response?.data?.message || 'An error occurred during GitHub sign in');
        
        // Fallback to showing the temporary implementation message
        toast({
          title: "GitHub Sign-In",
          description: "GitHub sign-in requires backend implementation. Please add the exchangeGitHubCode method to your API.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  async function handleSocialSignIn(provider: 'google' | 'github') {
    try {
      setIsLoading(true);
      setError(null);
      
      // Always attempt to trigger the sign-in prompt
      if (provider === 'google') {
        try {
          console.log('Triggering Google sign-in prompt');
          if (window.google && window.google.accounts) {
            window.google.accounts.id.prompt((notification) => {
              // Handle the case when the prompt is not displayed or skipped
              if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                console.log('Google sign-in prompt was not displayed', notification);
                // Force initialize again
                const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;
                if (window.google && window.google.accounts) {
                  window.google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: handleGoogleCallback,
                    auto_select: false,
                  });
                  
                  setTimeout(() => {
                    if (window.google && window.google.accounts) {
                      window.google.accounts.id.prompt();
                    }
                  }, 500);
                }
              }
            });
          } else {
            throw new Error('Google API not loaded');
          }
        } catch (err) {
          console.error('Error triggering Google sign-in prompt:', err);
          toast({
            title: "Google Sign-In Error",
            description: "There was a problem initializing Google Sign-In. Please try again later.",
            variant: "destructive",
          });
        }
      } else if (provider === 'github') {
        // Implement GitHub OAuth flow here
        try {
          // GitHub OAuth implementation
          // This uses the implicit flow with a popup window
          const clientId = process.env.VITE_GITHUB_CLIENT_ID; // Replace with your GitHub OAuth client ID
          const redirectUri = encodeURIComponent(window.location.origin + '/github-callback');
          const scope = encodeURIComponent('user:email');
          const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
          
          // Open popup window for GitHub authentication
          const width = 600;
          const height = 700;
          const left = window.innerWidth / 2 - width / 2;
          const top = window.innerHeight / 2 - height / 2;
          
          const popup = window.open(
            githubAuthUrl,
            'github-oauth',
            `width=${width},height=${height},left=${left},top=${top}`
          );
          
          // Poll for redirect back to our site with the authorization code
          if (popup) {
            const checkPopup = setInterval(() => {
              try {
                // Check if popup was closed or redirected to our site
                if (popup.closed) {
                  clearInterval(checkPopup);
                  setIsLoading(false);
                } else if (popup.location.href.includes(window.location.origin)) {
                  // Extract authorization code from URL
                  const code = new URL(popup.location.href).searchParams.get('code');
                  if (code) {
                    // Close the popup
                    popup.close();
                    clearInterval(checkPopup);
                    
                    // Exchange code for access token via your backend
                    handleGitHubCallback(code);
                  }
                }
              } catch (e) {
                // Access to cross-origin frames is blocked, which is expected
                // until the redirect happens
              }
            }, 500);
          } else {
            setError('Popup was blocked. Please allow popups for this site.');
            setIsLoading(false);
          }
        } catch (err) {
          console.error('GitHub auth error:', err);
          toast({
            title: "GitHub Sign-In Error",
            description: "There was a problem initializing GitHub Sign-In. Please try again later.",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error(`${provider} sign-in error:`, err);
      setError('An error occurred during social sign in');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props} style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-2'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className="text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder='name@example.com' 
                      {...field} 
                      className="bg-gray-800 border-gray-700 text-white" 
                      disabled={isLoading}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <FormLabel className="text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>Password</FormLabel>
                    <Link
                      to='/forgot-password'
                      className='text-sm font-medium text-gray-400 hover:text-white'
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput 
                      placeholder='********' 
                      {...field} 
                      className="bg-gray-800 border-gray-700 text-white" 
                      disabled={isLoading}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button 
              type="submit"
              className='mt-2 bg-blue-600 hover:bg-blue-700 text-white' 
              disabled={isLoading}
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}
            >
              {isLoading ? 'Signing in...' : 'Login'}
            </Button>

            <div className='relative my-2'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-gray-700' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-[#1a1a1a] px-2 text-gray-400' style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Or continue with
                </span>
              </div>
            </div>

            <div className='flex justify-center gap-4 mt-2'>
              {/* This div will be populated by Google's script */}
              <div id="google-signin-button" className="flex items-center justify-center"></div>
              
              {/* Hidden button that handles the actual sign-in */}
              <button
                type="button"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-gray-100 hidden"
                disabled={isLoading}
                onClick={() => handleSocialSignIn('google')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" className="h-5 w-5">
                  <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                  <path fill="#34A853" d="M168.9 384.9c-39.1-22.5-65.4-64.8-65.4-113.3 0-35.7 14.6-68.1 38.1-91.5l-68-65.5C34.3 152.9 8 201.6 8 256c0 54.4 26.3 103.1 67.1 133.6l93.8-104.7z"/>
                  <path fill="#FBBC05" d="M351.8 289.7c-9.5 29.8-35.6 51.3-68.3 51.3-41.1 0-75.9-25.9-88.5-62.1l-96.1 101.4c35.2 49.6 93.8 82.3 161.6 82.3 39.5 0 75.7-12.6 106.1-33.8l-14.8-139.1z"/>
                  <path fill="#EA4335" d="M248 8c-82.2 0-152.8 47.4-187.2 116.7l95.3 95.3c21.6-42.5 65.5-71.7 115.9-71.7 28.2 0 54.2 9.9 74.4 26l59.3-59.3C364.4 76.7 310.7 8 248 8z"/>
                </svg>
              </button>
              
              <button
                type="button"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-gray-100"
                disabled={isLoading}
                onClick={() => handleSocialSignIn('github')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 98 96">
                  <path fill="#24292f" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
                </svg>
              </button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
