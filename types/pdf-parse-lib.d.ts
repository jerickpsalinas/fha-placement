// pdf-parse's package entry point runs debug/test code when imported directly;
// the documented workaround is to import the library module by its subpath.
// @types/pdf-parse only declares the top-level module, so we re-export its
// default signature for the subpath here.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdf from "pdf-parse";
  export default pdf;
}
