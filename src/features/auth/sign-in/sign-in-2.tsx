import { UserAuthForm } from './components/user-auth-form'

export default function SignIn2() {
  return (
    <div className='container relative grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0' style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className='relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex'>
        <div 
          className='absolute inset-0 bg-cover bg-center bg-no-repeat' 
          style={{ 
            backgroundImage: 'url("/images/bg_signin.png")', // Replace with your image path
            backgroundSize: 'cover',
            filter: 'brightness(0.6) contrast(1.2)' // Enhanced filter
          }} 
        />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-2 h-6 w-6'
          >
            <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
          </svg>
          Shadcn Admin
        </div>

        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg' style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>
              &ldquo;This template has saved me countless hours of work and
              helped me deliver stunning designs to my clients faster than ever
              before.&rdquo;
            </p>
            <footer className='text-sm' style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 300 }}>John Doe</footer>
          </blockquote>
        </div>
      </div>
      <div className='h-full text-white' style={{ backgroundColor: '#1a1a1a' }}>
        <div className='mx-auto flex h-full w-full flex-col justify-center space-y-2 sm:w-[350px] p-8'>
          <div className='flex flex-col space-y-2 text-left'>
            <h1 className='text-2xl font-semibold tracking-tight text-white' style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}>Login</h1>
            <p className='text-sm text-gray-400' style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 300 }}>
              Enter your email and password below <br />
              to log into your account
            </p>
          </div>
          <UserAuthForm className='text-white' />
          <p className='px-8 text-center text-sm text-gray-400' style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 300 }}>
            By clicking login, you agree to our{' '}
            <a
              href='/terms'
              className='underline underline-offset-4 hover:text-primary'
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='/privacy'
              className='underline underline-offset-4 hover:text-primary'
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
