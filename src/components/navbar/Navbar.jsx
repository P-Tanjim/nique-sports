import React from 'react'
import Image from 'next/image'
import logo from '../../../public/logo.jpg'
import bdFlag from '../../../public/bd-flag.webp'
import usFlag from '../../../public/en-flag.webp'
import { Tabs, Button, Dropdown, Label } from '@heroui/react';
import NavSearchbar from '@/components/navbar/clientComponent/NavSearchbar'

const Navbar = () => {
  return (
    <>
      <nav className='px-20 py-3 w-full'>
        <div className='upper-navbar flex justify-between items-center'>
          <Image src={logo} width={50} height={50} alt='nique sports logo' />
          <NavSearchbar></NavSearchbar>
          <div>
            <Tabs className="w-fit h-auto">
              <Tabs.ListContainer>
                <Tabs.List aria-label="Options">
                  <Tabs.Tab id="overview">
                    <Image src={bdFlag} width={18} height={18} alt="Home Icon" />
                    <Tabs.Indicator className='px-2 py-2' />
                  </Tabs.Tab>
                  <Tabs.Tab id="analytics">
                    <Image src={usFlag} width={18} height={18} alt="Home Icon" />
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
          </div>
        </div>
      </nav>


      <div className='bottom-navbar flex justify-center items-center bg-primary py-3'>
        <Dropdown>
          <Button aria-label="Menu" variant="secondary">
            Actions
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu>
              <Dropdown.Item id="new-file" textValue="New file">
                <Label>New file</Label>
              </Dropdown.Item>
              <Dropdown.Item id="copy-link" textValue="Copy link">
                <Label>Copy link</Label>
              </Dropdown.Item>
              <Dropdown.Item id="edit-file" textValue="Edit file">
                <Label>Edit file</Label>
              </Dropdown.Item>
              <Dropdown.Item id="delete-file" textValue="Delete file" variant="danger">
                <Label>Delete file</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </>
  )
}

export default Navbar