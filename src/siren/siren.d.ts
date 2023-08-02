
export interface SirenFieldOption {
  name: string;
  value: string;
}

export interface SirenField {
  name: string;
  class?: string[];
  type?: string;
  value?: string;
  title?: string;
  options?: SirenFieldOption[],
}

export interface SirenAction {
  name: string;
  href: string;
  class?: string[];
  method?: string;
  title?: string;
  type?: string;
  fields?: SirenField[];

  getField(name: string): SirenField;
}

export interface SirenLink {
  href: string;
  rel: string[];
  class?: string[];
  type?: string;
  title?: string;
}

export interface SirenEmbeddedLink extends SirenLink {

}

export interface SirenEmbeddedRepresentation extends SirenEntity {
  rel: string[],
}

export interface SubEntity {

}

export interface SirenEntity {
  class?: string[];
  properties?: object;
  entities?: (SirenEmbeddedLink|SirenEmbeddedRepresentation)[];
  links?: SirenLink[];
  actions?: SirenAction[];
  title?: string;

  getAction(name: string): SirenAction;
  getLink(rel: string): SirenLink;
  getEntity(rel: string): SirenEmbeddedLink|SirenEmbeddedRepresentation;
  getEntities(rel: string): (SirenEmbeddedLink|SirenEmbeddedRepresentation)[];
}
