// import { useMediaQuery } from '../../shared/helpers/js/useMediaQuery';

function MenuOverlay(): void {
	const overlay = document.querySelector('.header__overlay') as HTMLElement;
	const menuItems = Array.from(document.querySelectorAll('.header__header-link')) as HTMLAnchorElement[];
	const menuPoint = document.querySelector('.header__point') as HTMLElement;

	menuItems.forEach((item: HTMLAnchorElement, index: number) => {
		item.addEventListener('mouseenter', function () {
			// Удаляем класс dimmed у всех пунктов меню
			menuItems.forEach((otherItem: HTMLAnchorElement) => {
				otherItem.classList.remove('dimmed');
				menuPoint.classList.remove('point'); // Удаляем область для подменю
			});
			// Добавляем класс dimmed к всем элементам, кроме текущего
			if (index < 2 || index === menuItems.length - 1) {
				overlay.classList.add('active');
				menuItems.forEach((otherItem: HTMLAnchorElement) => {
					if (otherItem !== this) {
						otherItem.classList.add('dimmed');
						menuPoint.classList.add('point'); // Добавляем область для подменю
					}
				});
			}
		});

		item.addEventListener('mouseleave', function () {
			overlay.classList.remove('active');
			menuItems.forEach((otherItem: HTMLAnchorElement) => {
				otherItem.classList.remove('dimmed'); // Удаляем затемнение при уходе курсора
				menuPoint.classList.remove('point'); // Удаляем область для подменю
			});
		});
	});
}

function HeaderOpenMobilemenu(): void {
	const burgerOpen = document.querySelector('.header__burger_open') as HTMLElement | null;
	const burgerClose = document.querySelector('.header__burger_close') as HTMLElement | null;
	const burgerMenu = document.querySelector('.header__mobilemenu-popup') as HTMLElement | null;

	if (!burgerOpen) return;

	burgerOpen?.addEventListener('click', () => {
		burgerMenu?.classList.add('opened');
		document.body.classList.add('no-scroll');
	});

	burgerClose?.addEventListener('click', () => {
		burgerMenu?.classList.remove('opened');
		document.body.classList.remove('no-scroll');
	});
}

export function HeaderMenu(): void {
	MenuOverlay();
	HeaderOpenMobilemenu();
}
