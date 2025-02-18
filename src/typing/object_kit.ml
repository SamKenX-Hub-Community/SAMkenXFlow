(*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *)

open Reason
open Type
open TypeUtil

module type OBJECT = sig
  val run :
    Type.trace ->
    Context.t ->
    Type.use_op ->
    Reason.t ->
    Type.Object.resolve_tool ->
    Type.Object.tool ->
    Type.t ->
    tout:Type.t ->
    unit

  val widen_obj_type :
    Context.t -> ?trace:Type.trace -> use_op:Type.use_op -> Reason.reason -> Type.t -> Type.t

  val mapped_type_of_keys :
    Context.t ->
    Type.trace ->
    Type.use_op ->
    Reason.t ->
    keys:Type.t ->
    property_type:Type.t ->
    Type.mapped_type_flags ->
    Type.t
end

module Kit (Flow : Flow_common.S) : OBJECT = struct
  include Flow

  let widen_obj_type cx ?trace ~use_op reason t =
    match t with
    | OpenT (r, id) ->
      let open Constraint in
      begin
        match Context.find_graph cx id with
        | Unresolved _ ->
          let open Object in
          let widened_id = Tvar.mk_no_wrap cx r in
          let tout = OpenT (r, widened_id) in
          flow_opt
            cx
            ?trace
            (t, ObjKitT (use_op, reason, Resolve Next, ObjectWiden widened_id, tout));
          tout
        | Resolved t
        | FullyResolved (lazy t) ->
          widen_obj_type cx ?trace ~use_op reason t
      end
    | UnionT (r, rep) ->
      UnionT
        ( r,
          UnionRep.ident_map
            (fun t ->
              if is_proper_def t then
                widen_obj_type cx ?trace ~use_op reason t
              else
                t)
            rep
        )
    | t -> t

  (* We use this function to transform a resolved UnionT into a ((name * reason) list * Type.t),
   * which represents a tuple of key names (with reasons for error messages) and an indexer to be
   * used to create a new object. All SinlgetonStrTs/StrTs are turned into keys and all other
   * non-empty types are turned into indexers. This is how we support non-homomorphic mapped types,
   * like {[key in 'a' | 'b' | number]: string} and also how we support mapped types that use
   * tparams with $Keys/keyof upper bounds:
   * type Pick<O: {...}, Keys: $Keys<O>> = {[key in Keys]: O[key]}
   *
   * Note that we use the PreprocessKitT constraint to flatten the union. A non-homomorphic mapped
   * type *must not* operate over Unresolved tvar because additional keys received in the future
   * will cause us to incorrectly output a union. While this approach of eagerly resolving the type
   * may lead to edge cases where we miss keys, it seems like the best way forward. To get rid of
   * these bugs in 100% of cases we'd need to make our EvalT machinery only operate over resolved
   * types.
   *)
  let partition_keys_and_indexer cx trace use_op reason keys =
    let key_upper_bound_reason desc = mk_reason desc (loc_of_reason reason) in
    let str_t = StrT.make (key_upper_bound_reason RString) (bogus_trust ()) in
    let num_t = NumT.make (key_upper_bound_reason RNumber) (bogus_trust ()) in
    let symbol_t = SymbolT.make (key_upper_bound_reason RSymbol) (bogus_trust ()) in
    let union = UnionT (reason, UnionRep.make str_t num_t [symbol_t]) in
    let compatibility_use_op =
      Frame
        (MappedTypeKeyCompatibility { source_type = reason_of_t keys; mapped_type = reason }, use_op)
    in
    (* All keys must be a subtype of string | number | symbol *)
    rec_flow_t cx trace ~use_op:compatibility_use_op (keys, union);
    let possible_types = Flow.possible_concrete_types_for_inspection cx reason keys in
    possible_types
    |> List.fold_left
         (fun (keys, indexers) t ->
           match t with
           | DefT (r, _, StrT (Literal (_, name)))
           | DefT (r, _, SingletonStrT name) ->
             ((name, r) :: keys, indexers)
           | DefT (_, _, EmptyT) -> (keys, indexers)
           | _ -> (keys, t :: indexers))
         ([], [])

  let mapped_type_of_keys cx trace use_op reason ~keys =
    let (keys_with_reasons, indexers) = partition_keys_and_indexer cx trace use_op reason keys in
    (* To go from a union to a MappedType we first build an object with all the keys we
     * extract from the union and create an object with all mixed values. Then we push it
     * through the mapped type machinery. The specific type we choose for the properties
     * does not matter because the mapped type code does not inspect the value types *)
    let mixed = MixedT.why reason (bogus_trust ()) in
    let mixed_prop_t key_reason =
      let key_loc = Some (loc_of_reason key_reason) in
      {
        Object.prop_t = mixed;
        is_own = true;
        is_method = false;
        polarity = Polarity.Neutral;
        key_loc;
      }
    in
    let props =
      keys_with_reasons
      |> List.fold_left
           (fun pmap (key, key_reason) -> NameUtils.Map.add key (mixed_prop_t key_reason) pmap)
           NameUtils.Map.empty
    in
    let generics = Generic.spread_empty in
    let obj_kind =
      match indexers with
      | [] -> Exact
      | t1 :: ts ->
        let key_t =
          match ts with
          | [] -> t1
          | t2 :: ts -> UnionT (reason, UnionRep.make t1 t2 ts)
        in
        Indexed { dict_name = None; key = key_t; value = mixed; dict_polarity = Polarity.Neutral }
    in
    let flags = { frozen = false; obj_kind } in
    let interface = None in
    let obj_reason = replace_desc_reason RObjectType reason in
    let slice = { Object.reason = obj_reason; props; flags; generics; interface } in
    fun ~property_type mapped_type_flags ->
      Slice_utils.map_object property_type mapped_type_flags cx reason use_op None slice

  let run =
    let open Object in
    (*****************)
    (* Object Spread *)
    (*****************)
    let object_spread =
      let dict_check trace cx use_op d1 d2 =
        rec_flow_t cx trace ~use_op (d2.key, d1.key);
        rec_unify cx trace ~use_op d1.value d2.value
      in
      let return trace cx use_op t tout = rec_flow_t cx trace ~use_op (t, tout) in
      let recurse trace cx use_op reason resolve_tool tool t tout =
        rec_flow cx trace (t, ObjKitT (use_op, reason, resolve_tool, tool, tout))
      in
      fun options state cx trace ->
        Slice_utils.object_spread
          ~dict_check:(dict_check trace)
          ~widen_obj_type:(widen_obj_type ~trace)
          ~add_output:(Flow_js_utils.add_output ~trace)
          ~return:(return trace)
          ~recurse:(recurse trace)
          options
          state
          cx
    in

    (**************************)
    (* Check component config *)
    (**************************)
    let check_component_config =
      let return trace cx use_op t tout = rec_flow_t cx trace ~use_op (t, tout) in
      fun pmap cx trace ->
        Slice_utils.check_component_config
          ~add_output:(Flow_js_utils.add_output ~trace)
          ~return:(return trace)
          pmap
          cx
    in

    (***************)
    (* Object Rest *)
    (***************)
    let object_rest =
      let open Object.Rest in
      let return trace cx use_op options t tout =
        match options with
        | ReactConfigMerge Polarity.Neutral ->
          rec_unify cx trace ~use_op:(use_op Polarity.Neutral) t tout
        | ReactConfigMerge Polarity.Negative ->
          rec_flow_t cx trace ~use_op:(use_op Polarity.Negative) (tout, t)
        | ReactConfigMerge Polarity.Positive ->
          rec_flow_t cx trace ~use_op:(use_op Polarity.Positive) (t, tout)
        | _ ->
          (* Intentional UnknownUse here. *)
          rec_flow_t ~use_op:unknown_use cx trace (t, tout)
      in
      let recurse trace cx use_op reason resolve_tool tool t tout =
        rec_flow cx trace (t, ObjKitT (use_op, reason, resolve_tool, tool, tout))
      in
      let subt_check trace ~use_op cx = rec_flow_t ~use_op cx trace in
      fun options state cx trace ->
        Slice_utils.object_rest
          ~add_output:(Flow_js_utils.add_output ~trace)
          ~return:(return trace)
          ~recurse:(recurse trace)
          ~subt_check:(subt_check trace)
          options
          state
          cx
    in
    (********************)
    (* Object Read Only *)
    (********************)
    let object_read_only cx trace _use_op reason x tout =
      (* We always use an unknown_use intentionally when flowing to the tout. The use_op associated
       * with the tvar is more relevant with the use of the ReadOnly type than the use_op associated
       * with the ReadOnly instantiation *)
      rec_flow_t ~use_op:unknown_use cx trace (Slice_utils.object_read_only cx reason x, tout)
    in
    (******************)
    (* Object Partial *)
    (******************)
    let object_partial cx trace _use_op reason x tout =
      (* We always use an unknown_use intentionally when flowing to the tout. The use_op associated
       * with the tvar is more relevant with the use of the Partial type than the use_op associated
       * with the Partial instantiation *)
      rec_flow_t
        ~use_op:unknown_use
        cx
        trace
        (Slice_utils.object_update_optionality `Partial cx reason x, tout)
    in
    (*******************)
    (* Object Required *)
    (*******************)
    let object_required cx trace _use_op reason x tout =
      (* We always use an unknown_use intentionally when flowing to the tout. The use_op associated
       * with the tvar is more relevant with the use of the Required type than the use_op associated
       * with the Required instantiation *)
      rec_flow_t
        ~use_op:unknown_use
        cx
        trace
        (Slice_utils.object_update_optionality `Required cx reason x, tout)
    in
    (**************)
    (* Object Rep *)
    (**************)
    let object_rep =
      let mk_object cx reason { Object.reason = r; props; flags; generics; interface = _ } =
        (* TODO(jmbrown): Add polarity information to props *)
        let polarity = Polarity.Neutral in
        let props =
          NameUtils.Map.map
            (fun { Object.prop_t = t; is_own = _; is_method; polarity = _; key_loc } ->
              if is_method then
                Method { key_loc; type_ = t }
              else
                Field { preferred_def_locs = None; key_loc; type_ = t; polarity })
            props
        in
        let flags =
          {
            flags with
            obj_kind =
              Obj_type.map_dict (fun dict -> { dict with dict_polarity = polarity }) flags.obj_kind;
          }
        in
        let call = None in
        let id = Context.generate_property_map cx props in
        let proto = ObjProtoT reason in
        Slice_utils.mk_object_type
          ~def_reason:r
          ~exact_reason:(Some reason)
          ~invalidate_aliases:true
          ~interface:None
          flags
          call
          id
          proto
          generics
      in
      fun cx trace use_op reason x tout ->
        let t =
          match Nel.map (mk_object cx reason) x with
          | (t, []) -> t
          | (t0, t1 :: ts) -> UnionT (reason, UnionRep.make t0 t1 ts)
        in
        rec_flow_t cx trace ~use_op (t, tout)
    in
    (****************)
    (* Object Widen *)
    (****************)
    let object_widen =
      let open Slice_utils in
      let mk_object cx reason { Object.reason = r; props; flags; generics; interface = _ } =
        let polarity = Polarity.Neutral in
        let props =
          NameUtils.Map.map
            (fun { Object.prop_t = t; is_own = _; is_method; polarity = _; key_loc } ->
              if is_method then
                Method { key_loc; type_ = t }
              else
                Field { preferred_def_locs = None; key_loc; type_ = t; polarity })
            props
        in
        let flags =
          {
            flags with
            obj_kind =
              Obj_type.map_dict (fun dict -> { dict with dict_polarity = polarity }) flags.obj_kind;
          }
        in
        let call = None in
        let id = Context.generate_property_map cx props in
        let proto = ObjProtoT reason in
        Slice_utils.mk_object_type
          ~def_reason:r
          ~exact_reason:None
          ~invalidate_aliases:true
          ~interface:None
          flags
          call
          id
          proto
          generics
      in
      let widen cx trace ~use_op ~obj_reason ~slice ~widened_id ~tout =
        let rec is_subset (x, y) =
          match (x, y) with
          | (UnionT (_, rep), u) -> UnionRep.members rep |> List.for_all (fun t -> is_subset (t, u))
          | (t, UnionT (_, rep)) -> UnionRep.members rep |> List.exists (fun u -> is_subset (t, u))
          | (MaybeT (_, t1), MaybeT (_, t2)) -> is_subset (t1, t2)
          | ( OptionalT { reason = _; type_ = t1; use_desc = _ },
              OptionalT { reason = _; type_ = t2; use_desc = _ }
            ) ->
            is_subset (t1, t2)
          | (DefT (_, _, (NullT | VoidT)), MaybeT _) -> true
          | (DefT (_, _, VoidT), OptionalT _) -> true
          | (t1, MaybeT (_, t2)) -> is_subset (t1, t2)
          | (t1, OptionalT { reason = _; type_ = t2; use_desc = _ }) -> is_subset (t1, t2)
          | (t1, t2) -> quick_subtype false t1 t2
        in
        let widen_type cx trace reason ~use_op t1 t2 =
          match (t1, t2) with
          | (t1, t2) when is_subset (t2, t1) -> (t1, false)
          | (OpenT (r1, _), OpenT (r2, _))
            when Slice_utils.(is_widened_reason_desc r1 && is_widened_reason_desc r2) ->
            rec_unify cx trace ~use_op t1 t2;
            (t1, false)
          | (OpenT (r, _), t2) when Slice_utils.is_widened_reason_desc r ->
            rec_flow_t cx trace ~use_op (t2, t1);
            (t1, false)
          | (t1, t2) ->
            let reason = replace_desc_new_reason (RWidenedObjProp (desc_of_reason reason)) reason in
            ( Tvar.mk_where cx reason (fun t ->
                  rec_flow_t cx trace ~use_op (t1, t);
                  rec_flow_t cx trace ~use_op (t2, t)
              ),
              true
            )
        in
        let widest = Context.spread_widened_types_get_widest cx widened_id in
        match widest with
        | None ->
          Context.spread_widened_types_add_widest cx widened_id slice;
          rec_flow_t cx trace ~use_op (mk_object cx obj_reason slice, tout)
        | Some widest ->
          let widest_pmap = widest.props in
          let widest_dict = Obj_type.get_dict_opt widest.Object.flags.obj_kind in
          let slice_dict = Obj_type.get_dict_opt slice.Object.flags.obj_kind in
          let new_pmap = slice.props in
          let pmap_and_changed =
            NameUtils.Map.merge
              (fun propname p1 p2 ->
                let p1 = get_prop widest.Object.reason p1 widest_dict in
                let p2 = get_prop slice.Object.reason p2 slice_dict in
                match (p1, p2) with
                | (None, None) -> None
                | (None, Some ({ Object.is_method = m; _ } as t)) ->
                  let (t', opt, missing_prop) = type_optionality_and_missing_property t in
                  let t' =
                    if opt && not missing_prop then
                      optional t'
                    else
                      possibly_missing_prop propname widest.Object.reason t'
                  in
                  Some ((t', m), true)
                | (Some ({ Object.is_method = m; _ } as t), None) ->
                  let (t', opt, missing_prop) = type_optionality_and_missing_property t in
                  let t' =
                    if opt && not missing_prop then
                      optional t'
                    else
                      possibly_missing_prop propname slice.Object.reason t'
                  in
                  Some ((t', m), not opt)
                | ( Some ({ Object.is_method = m1; _ } as t1),
                    Some ({ Object.is_method = m2; _ } as t2)
                  ) ->
                  let (t1', opt1, missing_prop1) = type_optionality_and_missing_property t1 in
                  let (t2', opt2, missing_prop2) = type_optionality_and_missing_property t2 in
                  let (t, changed) = widen_type cx trace obj_reason ~use_op t1' t2' in
                  if opt1 || opt2 then
                    Some
                      ( ( make_optional_with_possible_missing_props
                            propname
                            missing_prop1
                            missing_prop2
                            widest.Object.reason
                            t,
                          m1 || m2
                        ),
                        changed
                      )
                  else
                    Some ((t, m1 || m2), changed))
              widest_pmap
              new_pmap
          in
          let (pmap', changed) =
            NameUtils.Map.fold
              (fun k (t, changed) (acc_map, acc_changed) ->
                (NameUtils.Map.add k t acc_map, changed || acc_changed))
              pmap_and_changed
              (NameUtils.Map.empty, false)
          in
          (* TODO: (jmbrown) we can be less strict here than unifying. It may be possible to
           * also merge the dictionary types *)
          let (dict, changed) =
            match (widest_dict, slice_dict) with
            | (Some d1, Some d2) ->
              rec_unify cx trace ~use_op d1.key d2.key;
              rec_unify cx trace ~use_op d1.value d2.value;
              (Some d1, changed)
            | (Some _, None) -> (None, true)
            | _ -> (None, changed)
          in
          let (exact, changed) =
            if
              Obj_type.is_exact widest.Object.flags.obj_kind
              && not (Obj_type.is_exact slice.Object.flags.obj_kind)
            then
              (false, true)
            else
              ( Obj_type.is_exact widest.Object.flags.obj_kind
                && Obj_type.is_exact slice.Object.flags.obj_kind,
                changed
              )
          in
          if not changed then
            ()
          else
            let obj_kind =
              match (exact, dict) with
              | (_, Some d) -> Indexed d
              | (true, _) -> Exact
              | _ -> Inexact
            in
            let flags = { obj_kind; frozen = false } in
            let props =
              NameUtils.Map.map
                (fun (t, m) ->
                  {
                    Object.prop_t = t;
                    is_own = true;
                    is_method = m;
                    polarity = Polarity.Neutral;
                    key_loc = None;
                  })
                pmap'
            in
            let slice' =
              {
                Object.reason = slice.Object.reason;
                props;
                flags;
                generics = widest.generics;
                interface = None;
              }
            in
            Context.spread_widened_types_add_widest cx widened_id slice';
            let obj = mk_object cx slice.Object.reason slice' in
            rec_flow_t cx trace ~use_op (obj, tout)
      in
      fun widened_id cx trace use_op reason x tout ->
        Nel.iter (fun slice -> widen cx trace ~use_op ~obj_reason:reason ~slice ~widened_id ~tout) x
    in

    (****************)
    (* React Config *)
    (****************)
    let react_config =
      Object.ReactConfig.(
        (* All props currently have a neutral polarity. However, they should have a
         * positive polarity (or even better, constant) since React.createElement()
         * freezes the type of props. We use a neutral polarity today because the
         * props type we flow the config into is written by users who very rarely
         * add a positive variance annotation. We may consider marking that type as
         * constant in the future as well. *)
        let prop_polarity = Polarity.Neutral in
        let finish cx trace reason config defaults children =
          let {
            Object.reason = config_reason;
            props = config_props;
            flags = config_flags;
            generics = config_generics;
            interface = _;
          } =
            config
          in
          (* If we have some type for children then we want to add a children prop
           * to our config props. *)
          let config_props =
            Base.Option.value_map children ~default:config_props ~f:(fun children ->
                NameUtils.Map.add
                  (OrdinaryName "children")
                  {
                    Object.prop_t = children;
                    is_own = true;
                    is_method = false;
                    polarity = prop_polarity;
                    key_loc = None;
                  }
                  config_props
            )
          in
          (* Remove the key and ref props from our config. We check key and ref
           * independently of our config. So we must remove them so the user can't
           * see them. *)
          let config_props = NameUtils.Map.remove (OrdinaryName "key") config_props in
          let config_props = NameUtils.Map.remove (OrdinaryName "ref") config_props in

          let config_dict = Obj_type.get_dict_opt config_flags.obj_kind in
          (* Create the final props map and dict.
           *
           * NOTE: React will copy any enumerable prop whether or not it
           * is own to the config. *)
          let (props_map, flags, generics) =
            match defaults with
            (* If we have some default props then we want to add the types for those
             * default props to our final props object. *)
            | Some
                {
                  Object.reason = defaults_reason;
                  props = defaults_props;
                  flags = defaults_flags;
                  generics = defaults_generics;
                  interface = _;
                } ->
              let defaults_dict = Obj_type.get_dict_opt defaults_flags.obj_kind in
              (* Merge our props and default props. *)
              let props =
                NameUtils.Map.merge
                  (fun _ p1 p2 ->
                    let p1 = Slice_utils.get_prop config_reason p1 config_dict in
                    let p2 = Slice_utils.get_prop defaults_reason p2 defaults_dict in
                    match (p1, p2) with
                    | (None, None) -> None
                    | ( Some
                          {
                            Object.prop_t = t;
                            is_own = _;
                            is_method = m;
                            polarity = _;
                            key_loc = l;
                          },
                        None
                      ) ->
                      Some (l, t, m)
                    | ( None,
                        Some
                          {
                            Object.prop_t = t;
                            is_own = _;
                            is_method = m;
                            polarity = _;
                            key_loc = l;
                          }
                      ) ->
                      Some (l, t, m)
                    (* If a property is defined in both objects, and the first property's
                     * type includes void then we want to replace every occurrence of void
                     * with the second property's type. This is consistent with the behavior
                     * of function default arguments. If you call a function, `f`, like:
                     * `f(undefined)` and there is a default value for the first argument,
                     * then we will ignore the void type and use the type for the default
                     * parameter instead. *)
                    | ( Some
                          {
                            Object.prop_t = t1;
                            is_own = _;
                            is_method = m1;
                            polarity = _;
                            key_loc = l;
                          },
                        Some
                          {
                            Object.prop_t = t2;
                            is_own = _;
                            is_method = m2;
                            polarity = _;
                            key_loc = _;
                          }
                      ) ->
                      (* Use CondT to replace void with t1. *)
                      let t =
                        Tvar.mk_where cx reason (fun tvar ->
                            rec_flow
                              cx
                              trace
                              ( OpenT (reason, filter_optional cx ~trace reason t1),
                                CondT (reason, None, t2, tvar)
                              )
                        )
                      in
                      Some (l, t, m1 || m2))
                  config_props
                  defaults_props
              in
              (* Merge the dictionary from our config with the defaults dictionary. *)
              let dict =
                Base.Option.merge config_dict defaults_dict ~f:(fun d1 d2 ->
                    {
                      dict_name = None;
                      key = UnionT (reason, UnionRep.make d1.key d2.key []);
                      value =
                        UnionT
                          ( reason,
                            UnionRep.make
                              (Slice_utils.read_dict config_reason d1)
                              (Slice_utils.read_dict defaults_reason d2)
                              []
                          );
                      dict_polarity = prop_polarity;
                    }
                )
              in
              (* React freezes the config so we set the frozen flag to true. The
               * final object is only exact if both the config and defaults objects
               * are exact. *)
              let obj_kind =
                match dict with
                | Some d -> Indexed d
                | None ->
                  if
                    Obj_type.is_exact config_flags.obj_kind
                    && Obj_type.is_exact defaults_flags.obj_kind
                  then
                    Exact
                  else
                    Inexact
              in
              let flags = { frozen = true; obj_kind } in
              let generics = Generic.spread_append config_generics defaults_generics in
              (props, flags, generics)
            (* Otherwise turn our slice props map into an object props. *)
            | None ->
              let props =
                NameUtils.Map.map
                  (fun { Object.prop_t = t; is_own = _; is_method; polarity = _; key_loc = l } ->
                    (l, t, is_method))
                  config_props
              in
              (* Create a new dictionary from our config's dictionary with a
               * positive polarity. *)
              let dict =
                Base.Option.map config_dict ~f:(fun d ->
                    {
                      dict_name = None;
                      key = d.key;
                      value = d.value;
                      dict_polarity = prop_polarity;
                    }
                )
              in
              (* React freezes the config so we set the frozen flag to true. The
               * final object is only exact if the config object is exact. *)
              let obj_kind =
                Obj_type.obj_kind_from_optional_dict
                  ~dict
                  ~otherwise:
                    ( if Obj_type.is_exact config_flags.obj_kind then
                      Exact
                    else
                      Inexact
                    )
              in
              let flags = { frozen = true; obj_kind } in
              (props, flags, config_generics)
          in
          let call = None in
          (* Finish creating our props object. *)
          let props =
            NameUtils.Map.map
              (fun (key_loc, type_, is_method) ->
                if is_method then
                  Method { key_loc; type_ }
                else
                  Field { preferred_def_locs = None; key_loc; type_; polarity = prop_polarity })
              props_map
          in
          let id = Context.generate_property_map cx props in
          let proto = ObjProtoT reason in
          Slice_utils.mk_object_type
            ~def_reason:reason
            ~exact_reason:(Some reason)
            ~invalidate_aliases:false
            ~interface:None
            flags
            call
            id
            proto
            generics
        in
        fun state cx trace use_op reason x tout ->
          match state with
          (* If we have some type for default props then we need to wait for that
           * type to resolve before finishing our props type. *)
          | Config { defaults = Some t; children } ->
            let tool = Resolve Next in
            let state = Defaults { config = x; children } in
            rec_flow cx trace (t, ObjKitT (use_op, reason, tool, ReactConfig state, tout))
          (* If we have no default props then finish our object and flow it to our
           * tout type. *)
          | Config { defaults = None; children } ->
            let ts = Nel.map (fun x -> finish cx trace reason x None children) x in
            let t =
              match ts with
              | (t, []) -> t
              | (t0, t1 :: ts) -> UnionT (reason, UnionRep.make t0 t1 ts)
            in
            rec_flow cx trace (t, UseT (use_op, tout))
          (* If we had default props and those defaults resolved then finish our
           * props object with those default props. *)
          | Defaults { config; children } ->
            let ts =
              Nel.map_concat
                (fun c -> Nel.map (fun d -> finish cx trace reason c (Some d) children) x)
                config
            in
            let t =
              match ts with
              | (t, []) -> t
              | (t0, t1 :: ts) -> UnionT (reason, UnionRep.make t0 t1 ts)
            in
            rec_flow cx trace (t, UseT (use_op, tout))
      )
    in

    (**************)
    (* Object Map *)
    (**************)
    let object_map prop_type mapped_type_flags selected_keys_opt cx trace use_op reason x tout =
      let selected_keys =
        match selected_keys_opt with
        | Some keys -> Some (partition_keys_and_indexer cx trace use_op reason keys)
        | None -> None
      in
      let t =
        match
          Nel.map
            (Slice_utils.map_object prop_type mapped_type_flags cx reason use_op selected_keys)
            x
        with
        | (t, []) -> t
        | (t0, t1 :: ts) -> UnionT (reason, UnionRep.make t0 t1 ts)
      in
      (* Intentional UnknownUse here. *)
      rec_flow_t cx trace ~use_op:unknown_use (t, tout)
    in
    (*********************)
    (* Object Resolution *)
    (*********************)
    let next = function
      | Spread (options, state) -> object_spread options state
      | Rest (options, state) -> object_rest options state
      | ReactConfig state -> react_config state
      | ReadOnly -> object_read_only
      | Partial -> object_partial
      | Required -> object_required
      | ObjectRep -> object_rep
      | ObjectWiden id -> object_widen id
      | Object.ReactCheckComponentConfig pmap -> check_component_config pmap
      | Object.ObjectMap { prop_type; mapped_type_flags; selected_keys_opt } ->
        object_map prop_type mapped_type_flags selected_keys_opt
    in
    fun trace ->
      let add_output = Flow_js_utils.add_output ~trace in
      let return cx use_op t ~tout = rec_flow_t cx trace ~use_op (t, tout) in
      let next cx use_op tool reason x ~tout = next tool cx trace use_op reason x tout in
      let recurse cx use_op reason resolve_tool tool t ~tout =
        rec_flow cx trace (t, ObjKitT (use_op, reason, resolve_tool, tool, tout))
      in
      let statics cx r i =
        Tvar.mk_no_wrap_where cx r (fun tvar -> rec_flow cx trace (i, GetStaticsT tvar))
      in
      Slice_utils.run ~add_output ~return ~next ~recurse ~statics
end
