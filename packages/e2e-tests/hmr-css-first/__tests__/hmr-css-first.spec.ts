import { editFile, getPseudoContent, getText, isBuild } from '~utils';
import { randomInt } from 'node:crypto';

const getJsValue = () => getText('#js-value');
const getHtmlValue = () => getText('#html-value');
const getCssValue = async () => {
	let content = await getPseudoContent('#css-value', 'before');
	if (content.endsWith('"')) {
		content = content.slice(0, -1);
	}
	if (content.startsWith('"')) {
		content = content.slice(1);
	}
	return content;
};

const updateJsValue = (num: number) => {
	editFile('src/App.svelte', (content) => content.replace(/JS_VALUE_\d+/, `JS_VALUE_${num}`));
};
const updateHtmlValue = (num: number) => {
	editFile('src/App.svelte', (content) => content.replace(/HTML_VALUE_\d+/, `HTML_VALUE_${num}`));
};
const updateCssValue = (num: number) => {
	editFile('src/App.svelte', (content) => content.replace(/CSS_VALUE_\d+/, `CSS_VALUE_${num}`));
};

test('should render App', async () => {
	await expect.poll(getJsValue).toEqual('JS_VALUE_1');
	await expect.poll(getHtmlValue).toEqual('HTML_VALUE_1');
	await expect.poll(getCssValue).toEqual('CSS_VALUE_1');
});

if (!isBuild) {
	describe('hmr', () => {
		test('should apply js change in App.svelte', async () => {
			await expect.poll(getJsValue).toEqual('JS_VALUE_1');
			updateJsValue(2);
			await expect.poll(getJsValue).toEqual('JS_VALUE_2');
		});

		test('should apply html change in App.svelte', async () => {
			await expect.poll(getHtmlValue).toEqual('HTML_VALUE_1');
			updateHtmlValue(2);
			await expect.poll(getHtmlValue).toEqual('HTML_VALUE_2');
		});

		test('should apply css changes in App.svelte', async () => {
			await expect.poll(getCssValue).toEqual('CSS_VALUE_1');
			updateCssValue(2);
			await expect.poll(getCssValue).toEqual('CSS_VALUE_2');
		});

		test('should apply changes in fuzz test', async () => {
			for (let i = 0; i < 20; i++) {
				const pick = randomInt(3); // 0,1,2
				const randomNumber = randomInt(1, 99999);
				if (pick === 0) {
					updateJsValue(randomNumber);
					await expect.poll(getJsValue).toEqual(`JS_VALUE_${randomNumber}`);
				} else if (pick === 1) {
					updateHtmlValue(randomNumber);
					await expect.poll(getHtmlValue).toEqual(`HTML_VALUE_${randomNumber}`);
				} else {
					updateCssValue(randomNumber);
					await expect.poll(getCssValue).toEqual(`CSS_VALUE_${randomNumber}`);
				}
			}
		});
	});
}
