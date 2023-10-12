import React from 'react'
import kate from '../kate.jpeg'


const Home = () => {
    // display the image of kate that is located in the root directory
  return (
    <div>
        <img className='w-full' src={kate} alt="Kate" />
    </div>

  )
}

export default Home