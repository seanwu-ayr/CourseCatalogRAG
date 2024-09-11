import React from 'react'

import Image from 'next/image'
import scuPhoto from '@/public/scu_photo.jpg'
import ChatbotWindow from '@/components/ui/chatbot_window'

const PreviewPage = () => {
  return (
    <>
      <div className="shadow-2xl">
        <div className="text-white relative flex flex-row justify-center h-[500px] mb-8">
          <div className="bg-scuBgPhoto blur-none absolute inset-0 bg-cover bg-center overflow-hidden">
          </div>

          <div className="bg-scuBgPhoto blur-sm absolute inset-0 bg-cover bg-center overflow-hidden">
          </div>

          <div className="relative flex flex-col justify-center items-center">
            <h1 className="text-6xl font-bold my-8 [text-shadow:_2px_2px_5px_black]">Welcome to this Test Page</h1>
            <p className="text-lg [text-shadow:_2px_2px_5px_black]">
              Preview and test the functionality and aesthetics of your   custom chatbot.
            </p>
          </div>
        </div>

        <div className="flex flex-row p-8 items-start">
            <p>
              Lorem ipsum odor amet, consectetuer adipiscing elit. Montes lobortis est posuere netus dolor congue molestie. Pulvinar nostra arcu, taciti orci amet senectus. Tortor consectetur malesuada convallis maximus faucibus class elementum ut. Elementum platea interdum dis pretium fermentum et viverra sed in. Torquent molestie dictumst consectetur commodo velit cubilia ac donec. Porta dolor cras non lacinia magnis vehicula proin purus. Eros tellus nisl volutpat duis praesent.
              Per nunc molestie orci aptent sagittis pellentesque. Erat per porttitor sagittis vitae elit. Auctor ridiculus ornare efficitur curae non tristique. Eleifend eleifend vivamus fames molestie proin bibendum mauris tortor. Feugiat ultrices tincidunt elit quam massa potenti, risus vitae. Pretium nisi nostra placerat faucibus eleifend habitasse rhoncus tellus.
              Sit nisi habitasse viverra vivamus nunc. Iaculis praesent imperdiet metus fames praesent. Aenean neque gravida rutrum leo pharetra pellentesque torquent leo. In leo hac in, gravida efficitur lobortis. Rhoncus gravida finibus aenean; erat nisl ultricies lobortis. Donec tempus sociosqu libero efficitur suspendisse. Interdum interdum sapien donec vehicula adipiscing lacus egestas.
            </p>

            <Image className="ml-8 object-scale-down" src={scuPhoto} alt="College Photo" width={500} height={500} priority={true}></Image>
        </div>
      </div>

      <ChatbotWindow></ChatbotWindow>
    </>
  )
}

export default PreviewPage