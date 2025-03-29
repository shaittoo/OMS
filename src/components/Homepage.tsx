import React from 'react'
import Link from 'next/link'

 export default function HomePage() {
    return (
      <div>
        <div className="mx-auto px-6 lg:max-w-7xl lg:px-8">
          <div className="mt-10 grid gap-4 sm:mt-16 lg:h-auto lg:grid-cols-5 lg:grid-rows-4" style={{gridTemplateRows: '40% 10% 10% 40%'}}>
            <div className="relative lg:row-span-4 lg:col-span-3 justify"> {/* card 1 */}
              <div className="absolute pt-3">
                <img src="/assets/woman.svg" alt="woman"/>
              </div>
              <div className="flex pl-8 pt-28">
                <img src="/assets/bg.svg" alt="bg" />
              </div>
            </div>
            <div className="relative lg:col-start-4 lg:col-span-2 justify"> {/* card 2 */}
              <div className="absolute pt-32 pl-5">
                <p style={{fontSize: '36px', fontFamily :'Arial', lineHeight :'1.22'}}><b>Login to an Account{<br/>}to enhance your{<br/>}OMS experience</b></p>
              </div>
            </div>
            <div className="relative lg:col-start-4 lg:row-start-2 lg:col-span-2"> {/* card 3 */}
              <div className="absolute pl-5 pt-5">
                <p style={{fontSize: '16px', fontFamily :'Arial', lineHeight :'1.1'}}>Whether you’re an officer overseeing activities or a{<br/>}regular member staying informed, logging in with your{<br/>}OMS Account provides you with the tools you need to{<br/>}stay engaged and connected.</p>
              </div>
            </div>
            <div className="relative lg:col-start-4 lg:row-start-3"> {/* card 4 */}
              <Link href="/choose" className="absolute inset-px pt-5">
                  <div className='py-4 rounded-3xl' style={{backgroundColor: 'rgba(135,54,234,0.1)'}}>
                    <div className='text-center' style={{fontSize: '32px', fontFamily: 'Arial'}}>
                      Sign up
                    </div>
                  </div>
              </Link>
            </div>
            <div className="relative lg:col-start-5 lg:row-start-3"> {/* card 5 */}
            <Link href="/login" className="absolute inset-px pt-5">
                  <div className='py-4 rounded-3xl' style={{backgroundColor: 'rgba(135,54,234,0.1)'}}>
                    <div className='text-center' style={{fontSize: '32px', fontFamily :'Arial'}}>
                      <p>Log in</p>
                    </div>
                  </div>
              </Link>
            </div>
          
            <div className="relative lg:col-start-4 lg:row-start-4 lg:col-span-2 pt-8"> {/* card 6 */}
              <a href="#">
                <div className=" grid lg:grid-cols-2 lg:grid-rows-2 rounded-3xl" style={{backgroundColor: 'rgba(135,54,234,1)'}}>
                  <div className="flex lg:col-start-2 lg:col-span-1 lg:row-span-1 pl-44 pb-10">
                    <img src="/assets/arrow.svg" alt="arrow" className="rounded-l-sm rounded-b-sm mt-2"style={{backgroundClip: 'none'}}/>
                  </div>
                  <Link href="/guestviewevents">
                  <div className="relative lg:row-start-2 lg:col-span-2 rounded-3xl" style={{backgroundColor: 'rgba(135,54,234,1)'}}>
                    <p className="pl-5 pt-10"style={{fontSize: '32px', fontFamily :'Arial', color: 'white'}}>Explore More</p>
                  </div>  </Link>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }