(*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *)

type ac_result = {
  result: ServerProt.Response.Completion.t;
  errors_to_log: string list;
}

type autocomplete_service_result =
  | AcResult of ac_result
  | AcEmpty of string
  | AcFatalError of string

val autocomplete_get_results :
  env:ServerEnv.env ->
  options:Options.t ->
  reader:Parsing_heaps.Reader.reader ->
  cx:Context.t ->
  file_sig:File_sig.t ->
  ast:(Loc.t, Loc.t) Flow_ast.Program.t ->
  typed_ast:(ALoc.t, ALoc.t * Type.t) Flow_ast.Program.t ->
  imports:bool ->
  imports_ranked_usage:bool ->
  show_ranking_info:bool ->
  string option ->
  Loc.t ->
  string option * ALoc.t option * string * autocomplete_service_result
