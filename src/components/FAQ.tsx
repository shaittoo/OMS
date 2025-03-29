import React from 'react';

export default function FAQ(){
    return (
        <div className="pt-20 pl-48">
            <h1 style={{fontSize: '32px', fontFamily :'ADLaM Display'}}><b>Frequently Asked Questions</b></h1>
            <div className="pt-5 grid gap-4 pb-10 lg:h-auto lg:grid-cols-2 lg:grid-rows-3" style={{gridTemplateRows: '50px 50px 50px', gridTemplateColumns: '580px 580px'}}>
                <div className="relative max-lg:row-start-1 lg:col-start-1">
                    <a href='#'>
                        <div className="absolute inset-px rounded-lg bg-white"></div>
                            <div className="relative flex pt-3 pl-4">
                                <img src="/assets/add.svg" alt="woman"/><p className="pl-3"style={{fontSize: '16px', fontFamily :'Inter'}}>What is OMS for?</p>
                            </div>
                        <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5"></div>
                    </a>
                </div>
                <div className="relative max-lg:row-start-1 lg:col-start-2">
                    <a href='#'>
                        <div className="absolute inset-px rounded-lg bg-white"></div>
                            <div className="relative flex pt-3 pl-4">
                                <img src="/assets/add.svg" alt="woman"/><p className="pl-3"style={{fontSize: '16px', fontFamily :'Inter'}}>When can I use or access the OMS?</p>
                            </div>
                        <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5"></div>
                    </a>
                </div>
                <div className="relative max-lg:row-start-2 lg:col-start-1">
                    <a href='#'>
                        <div className="absolute inset-px rounded-lg bg-white"></div>
                            <div className="relative flex pt-3 pl-4">
                                <img src="/assets/add.svg" alt="woman"/><p className="pl-3"style={{fontSize: '16px', fontFamily :'Inter'}}>What is OMS for?</p>
                            </div>
                        <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5"></div>
                    </a>
                </div>
                <div className="relative max-lg:row-start-2 lg:col-start-2">
                    <a href='#'>
                        <div className="absolute inset-px rounded-lg bg-white"></div>
                            <div className="relative flex pt-3 pl-4">
                                <img src="/assets/add.svg" alt="woman"/><p className="pl-3"style={{fontSize: '16px', fontFamily :'Inter'}}>When can I use or access the OMS?</p>
                            </div>
                        <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5"></div>
                    </a>
                </div>
                <div className="relative max-lg:row-start-3 lg:col-start-1">
                    <a href='#'>
                        <div className="absolute inset-px rounded-lg bg-white"></div>
                            <div className="relative flex pt-3 pl-4">
                                <img src="/assets/add.svg" alt="woman"/><p className="pl-3"style={{fontSize: '16px', fontFamily :'Inter'}}>What is OMS for?</p>
                            </div>
                        <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5"></div>
                    </a>
                </div>
                <div className="relative max-lg:row-start-3 lg:col-start-2">
                    <a href='#'>
                        <div className="absolute inset-px rounded-lg bg-white"></div>
                            <div className="relative flex pt-3 pl-4">
                                <img src="/assets/add.svg" alt="woman"/><p className="pl-3"style={{fontSize: '16px', fontFamily :'Inter'}}>When can I use or access the OMS?</p>
                            </div>
                        <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5"></div>
                    </a>
                </div>
            </div>
        </div>
    )
}