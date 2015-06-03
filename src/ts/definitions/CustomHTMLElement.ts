interface CustomHTMLElement extends HTMLElement {
	createdCallback() : void ;
	attachedCallback() :void;
	attributeChangedCallback(attribute,oldVal,newVal) : void;
	shadowDOM : Document;
}