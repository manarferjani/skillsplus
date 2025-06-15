import { Link } from '@tanstack/react-router'
import { SignUpForm } from './components/sign-up-form'

export default function SignUp() {
  return (
    <div
      className='container relative grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <div className='relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex'>
        <div
          className='absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{
            backgroundImage: 'url("/images/loginn.jpeg")',
            backgroundSize: 'cover',
            //filter: 'brightness(1) contrast(1.2)',
          }}
        />
        <div className='relative z-20 ml-[-2rem] mt-[-3rem] flex items-center pt-0 text-lg font-medium'>
          <img
            src='/images/skLogo.png'
            alt='SkillBloom Logo'
            style={{ height: '10rem' }}
            className='h-28 w-auto'
          />
        </div>

        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p
              className='text-lg'
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 500,
              }}
            >
              &ldquo;We all need people who will give us feedback. That's how we
              improve.&rdquo;
            </p>
            <footer
              className='text-sm'
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 300,
              }}
            >
              Bill Gates
            </footer>
          </blockquote>
        </div>
      </div>
      <div className='h-full text-white' style={{ backgroundColor: '#bee1e6' }}>
        <div className='mx-auto flex h-full w-full flex-col justify-center space-y-2 p-8 sm:w-[350px]'>
          <div className='flex flex-col space-y-2 text-left'>
            <h1
              className='text-left text-lg font-bold tracking-tight text-white'
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
              }}
            >
              Create an account
            </h1>
            <p
              className='text-sm text-gray-800'
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 300,
              }}
            >
              Enter your email and password to create an account.
            </p>
          </div>
          <SignUpForm />
          <div className='flex flex-col space-y-2 text-left text-sm'>
            <p
              className='text-center text-sm text-gray-800'
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
              }}
            >
              Already have an account?{' '}
              <Link
                to='/sign-in-2'
                className='text-gray-400 underline underline-offset-4 hover:text-blue-400'
              >
                Sign In
              </Link>
              <br />
              <a
                href='/terms'
                className='text-gray-400 underline underline-offset-4 hover:text-blue-400'
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
