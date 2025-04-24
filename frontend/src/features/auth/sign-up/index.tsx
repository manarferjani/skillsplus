import { Link } from '@tanstack/react-router'
import { SignUpForm } from './components/sign-up-form'

export default function SignUp() {
  return (
    <div className='container relative grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0' style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className='relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex'>
        <div 
          className='absolute inset-0 bg-cover bg-center bg-no-repeat' 
          style={{ 
            backgroundImage: 'url("/images/login_bg.png")',
            backgroundSize: 'cover',
            filter: 'brightness(0.6) contrast(1.2)'
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
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>Skillsplus</span>
        </div>

        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg' style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>
              &ldquo;This platform has helped me improve my skills and connect with like-minded professionals.&rdquo;
            </p>
            <footer className='text-sm' style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 300 }}>Sarah Johnson</footer>
          </blockquote>
        </div>
      </div>
      <div className='h-full text-white' style={{ backgroundColor: '#1a1a1a' }}>
        <div className='mx-auto flex h-full w-full flex-col justify-center space-y-2 sm:w-[350px] p-8'>
          <div className='flex flex-col space-y-2 text-left'>
            <h1 className='text-lg text-center font-semibold tracking-tight text-white' style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}>
              Create an account
            </h1>
            <p className='text-sm text-gray-400' style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 300 }}>
              Enter your email and password to create an account. 
            </p>
          </div>
          <SignUpForm />
          <div className='flex flex-col text-center text-sm space-y-2 text-left'>
            <p className='text-sm text-gray-400' style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}>
              
              Already have an account?{' '}
              <Link
                to='/sign-in-2'
                className='underline underline-offset-4 hover:text-blue-400 text-gray-300'
              >
                Sign In
              </Link><br />
              <a
              href='/terms'
              className='underline underline-offset-4 hover:text-blue-400 text-gray-300'
              >
              Terms of Service
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
