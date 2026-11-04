import React from 'react';
import { FooterMap } from './FooterMap';
import './Footer.css';

const handleRedirect = () => {
  window.open("https://profi-uc.ru/")
};

export const Footer: React.FC = () => {
    const coordinates: [number, number] = [57.001402, 41.007886]; //координаты г. Иваново ул. Уткина, 13

    return (
        <footer className="footer">

            <div className="footer__contacts">
                <div className="footer__container">
                    <h2 className="footer__title">Контактная информация</h2>
                    <div className="footer__info-row">
                        <span className="footer__info-item underlined" onClick={handleRedirect}>profi-uc.ru</span>


                        <span className="footer__info-item">
                           <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.43 11.685C7.59 15.93 11.07 19.395 15.315 21.57L18.615 18.27C19.02 17.865 19.62 17.73 20.145 17.91C21.825 18.465 23.64 18.765 25.5 18.765C26.325 18.765 27 19.44 27 20.265V25.5C27 26.325 26.325 27 25.5 27C11.415 27 0 15.585 0 1.5C0 0.675 0.675 0 1.5 0H6.75C7.575 0 8.25 0.675 8.25 1.5C8.25 3.375 8.55 5.175 9.105 6.855C9.27 7.38 9.15 7.965 8.73 8.385L5.43 11.685Z" fill="white"/>
                            </svg>

                            +7 (4932) 58-68-78
                        </span>


                        <span className="footer__info-item">
                           <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M18.0001 3C11.3836 3 6.00012 8.3835 6.00012 14.9925C5.95662 24.66 17.5441 32.676 18.0001 33C18.0001 33 30.0436 24.66 30.0001 15C30.0001 8.3835 24.6166 3 18.0001 3ZM18.0001 21C14.6851 21 12.0001 18.315 12.0001 15C12.0001 11.685 14.6851 9 18.0001 9C21.3151 9 24.0001 11.685 24.0001 15C24.0001 18.315 21.3151 21 18.0001 21Z" fill="white"/>
                            </svg>

                            г. Иваново, ул. Уткина, 13
                        </span>
                    </div>
                </div>
            </div>


            <div className="footer__map-wrapper">
                <FooterMap
                    center={coordinates}
                    address="г. Иваново, ул. Уткина, 13"
                />
            </div>
        </footer>
    );
};