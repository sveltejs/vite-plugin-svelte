<script>
	import {
		Accordion,
		AccordionItem,
		Button,
		DatePickerInput,
		Link,
		DatePicker
	} from 'carbon-components-svelte';
	import { Save } from 'carbon-icons-svelte';
	/*
	// deep imports
	import Accordion from 'carbon-components-svelte/src/Accordion/Accordion.svelte'
	import AccordionItem from 'carbon-components-svelte/src/Accordion/AccordionItem.svelte'
	import Button from 'carbon-components-svelte/src/Button/Button.svelte'
	import DatePickerInput from 'carbon-components-svelte/src/DatePicker/DatePickerInput.svelte'
	import Link from 'carbon-components-svelte/src/Link/Link.svelte'
	import DatePicker from 'carbon-components-svelte/src/DatePicker/DatePicker.svelte'
	import Save from 'carbon-icons-svelte/lib/Save.svelte';
*/

	import { assign } from 'lodash-es';
	import toNumber from 'lodash-es/toNumber.js';
	import toPath from 'lodash-es/toPath.js';

	console.log(assign, toNumber, toPath);
</script>

<Button>Hello</Button>

<Link>A</Link>

<DatePicker datePickerType="single" flatpickrProps={{ static: true }}>
	<DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
</DatePicker>

<Accordion>
	<AccordionItem title="Section 1" open>Content 1</AccordionItem>
	<AccordionItem title="Section 2">Content 2</AccordionItem>
	<AccordionItem title="Section 3">Content 3</AccordionItem>
</Accordion>
<Save />
