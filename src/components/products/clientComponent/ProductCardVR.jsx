import { Button } from "@heroui/react";
import Image from "next/image";
import React from "react";

const ProductCardVR = ({ product }) => {
    return (
        <div className='w-full relative h-auto rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.2)] p-2 flex gap-2'>
            <div className="absolute -left-1.25 -top-2.5 transform -rotate-20 h-10 w-10 bg-red-500 flex justify-center items-center text-sm font-medium text-white"
                style={{
                    clipPath: `polygon(
                        50% 0%, 59% 16%, 63% 2%, 69% 19%, 75% 7%, 77% 24%,
                        85% 15%, 83% 31%, 93% 25%, 87% 40%, 98% 37%, 89% 50%,
                        98% 63%, 87% 60%, 93% 75%, 83% 69%, 85% 85%, 77% 76%,
                        75% 93%, 69% 81%, 63% 98%, 59% 84%, 50% 100%, 41% 84%,
                        37% 98%, 31% 81%, 25% 93%, 23% 76%, 15% 85%, 17% 69%,
                        7% 75%, 13% 60%, 2% 63%, 11% 50%, 2% 37%, 13% 40%,
                        7% 25%, 17% 31%, 15% 15%, 23% 24%, 25% 7%, 31% 19%,
                        37% 2%, 41% 16%
                    )`
                }}
            >
                20%
            </div>
            <Image src={product.image} width={100} height={100} alt="Product Image" className="bg-white rounded-2xl"></Image>
            <div className="flex flex-col gap-2 p-2">
                <p className="text-text font-semibold text-sm line-clamp-2">{product.title}</p>
                <div className="flex gap-1">
                    <p className="text-text-muted text-sm font-semibold line-through">{product.price}৳</p>
                    <p className="text-text text-sm font-semibold">২০০৳</p>
                </div>
                <Button className={'bg-primary w-full max-h-9 rounded-xl'}>Get Offer</Button>
            </div>
        </div>
    );
};

export default ProductCardVR;