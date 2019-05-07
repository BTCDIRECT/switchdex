import { Collectible } from '../util/types';

export class Erc721 {
    // @TODO: abstract the source of collectibles data (opensea/mocked)
    // tslint:disable-next-line
    public fetchUserCollectibles(): Collectible[] {
        return [
            {
                tokenId: '1',
                name: 'Glitter',
                price: '2.30',
                color: '#F6FEFC',
                image: 'https://res.cloudinary.com/ddklsa6jc/image/upload/v1556888670/6_w93q19.png',
            },
            {
                tokenId: '2',
                name: 'Furbeard',
                price: '1.22',
                color: '#F6C68A',
                image: 'https://res.cloudinary.com/ddklsa6jc/image/upload/v1556888668/9_xunbhn.png',
            },
            {
                tokenId: '3',
                name: 'Glasswalker',
                price: '3.41',
                color: '#CAFAF7',
                image: 'https://res.cloudinary.com/ddklsa6jc/image/upload/v1556888668/10_iqm4un.png',
            },
            {
                tokenId: '4',
                name: 'Ande',
                price: '4.40',
                color: '#B8F1B9',
                image: 'https://res.cloudinary.com/ddklsa6jc/image/upload/v1556888667/5_sxqrol.png',
            },
            {
                tokenId: '5',
                name: 'Squib',
                price: '10.30',
                color: '#CFD4F9',
                image: 'https://res.cloudinary.com/ddklsa6jc/image/upload/v1556888664/1_sz6sji.png',
            },
            {
                tokenId: '6',
                name: 'Negato',
                price: '11.30',
                color: '#D7BBF3',
                image: 'https://res.cloudinary.com/ddklsa6jc/image/upload/v1556888661/8_qjebni.png',
            },
            {
                tokenId: '7',
                name: 'DuCat',
                price: '12.90',
                color: '#D6DDD8',
                image: 'https://res.cloudinary.com/ddklsa6jc/image/upload/v1556888654/2_yndavu.png',
            },
            {
                tokenId: '8',
                name: 'Berry',
                price: '2.30',
                color: '#F7B4D5',
                image: 'https://res.cloudinary.com/ddklsa6jc/image/upload/v1556888653/4_do9hzd.png',
            },
            {
                tokenId: '9',
                name: 'Vernon',
                price: '9.30',
                color: '#EADDDD',
                image: 'https://res.cloudinary.com/ddklsa6jc/image/upload/v1556888649/7_n9ro9n.png',
            },
            {
                tokenId: '10',
                name: 'Lee',
                price: '7.80',
                color: '#B8B2B3',
                image: 'https://res.cloudinary.com/ddklsa6jc/image/upload/v1556888649/3_mpghqd.png',
            },
        ];
    }
}

let erc721: Erc721;
export const getErc721 = (): Erc721 => {
    if (!erc721) {
        erc721 = new Erc721();
    }

    return erc721;
};
