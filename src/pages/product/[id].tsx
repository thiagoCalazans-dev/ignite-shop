import { GetStaticPaths, GetStaticProps } from "next"
import { useRouter } from "next/router"
import Stripe from "stripe"
import { stripe } from "../../lib/stripe"
import { ImageContainer, ProductContainer, ProductDetails } from "../../styles/pages/product"
import { priceFormatter } from "../../utils/formatter"
import Image from "next/image";
import axios from "axios"
import { useState } from "react"
import Head from "next/head"


interface productProps {
    product: {
        id: string;
        name: string;
        imageUrl: string;
        price: string;
        description: string;
        defaultPriceId: string;
    }
}

export default function Product({ product }: productProps) {


    const [isCreateCheckoutSession, setIsCreatingCheckoutSession] = useState(false)

    const { isFallback, push } = useRouter()
    if (isFallback) {
        return <p>loading...</p>
    }



    async function handleBuyProduct() {

        try {
            setIsCreatingCheckoutSession(true)
            const response = await axios.post('/api/checkout', {
                priceId: product.defaultPriceId
            })
            const { checkoutUrl } = response.data;
            // push('/checkout') <- para redirecioanr para uma rota interna
            window.location.href = checkoutUrl;

        } catch (err) {
            //conectar em uma api de observabilidade datadog/sentry
            setIsCreatingCheckoutSession(false)
            alert('Falha ao redirecionar ao checkout')
            console.log(err)
        }
    }
    return (
        <>
            <Head>
                <title>{product.name} | Ignite Shop</title>
            </Head>
            <ProductContainer>
                <ImageContainer>
                    <Image src={product.imageUrl} width={520} height={480} alt="" />
                </ImageContainer>
                <ProductDetails>
                    <h1>{product.name}</h1>
                    <span>{product.price}</span>
                    <p>{product.description}</p>
                    <button disabled={isCreateCheckoutSession} onClick={handleBuyProduct}>Comprar agora</button>
                </ProductDetails>
            </ProductContainer>
        </>
    )
}

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [
        ],
        fallback: true,
    }
}


export const getStaticProps: GetStaticProps<any, { id: string }> = async ({ params }) => { //o primeiro parametro seria o tipo de retorno do props, o segundo e o params

    const productId = params.id

    const product = await stripe.products.retrieve(productId, {
        expand: ['default_price']
    });

    const price = product.default_price as Stripe.Price

    return {
        props: {
            product: {
                id: product.id,
                name: product.name,
                imageUrl: product.images[0],
                price: priceFormatter.format(price.unit_amount / 100),
                description: product.description,
                defaultPriceId: price.id,
            },
            revalidade: 60 * 60 * 1, //1 hour
        },

    }
}