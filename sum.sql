
-- Each summary is initially an array of 29 with s_rank, o_fill, o1, p1, sc1, o2, p2, sc2 
-- and so on.  After so many entries, more are not added.


create procedure s_sum_init (inout env any)
{
  env := make_array (30, 'any');
}

create procedure s_sum_acc (inout env any, in s_rank double precision, in p iri_id, in o any, in sc int)
{
  declare fill int;
  fill := env[1];
  if (fill = 0)
    env[0] := s_rank;
  else if (fill >= 25)
    return;
  env[2] := env[2] + sc;
  env[fill + 3] := o;
  env[fill + 4] := p;
  env[fill + 5] := sc;
  env[1] := fill + 3;
}


create procedure s_sum_fin (inout env any)
{
  return env;
}


create aggregate DB.DBA.S_SUM (in s_rank double precision, in p iri_id, in o any, in sc int) returns any from 
  s_sum_init, s_sum_acc, s_sum_fin;

create procedure sum_rank (inout arr any)
{
  return  rnk_scale (arr[0]) + cast (arr[2] as real) / (arr[1] / 3);
}


create procedure sum_o_p_score (inout o any, inout p any)
{
  declare p_weight any;
  declare lng_m, pm int;
  declare lng_pref any;
  lng_pref := connection_get ('lang');
  p_weight := connection_get ('p_weight');
  if (lng_pref is not null and is_rdf_box (o) and rdf_box_lang (o) = lng_pref)
    lng_m := 3;
  else
    lng_m := 0;
  if (p_weight is null)
    return lng_m;
  pm := dict_get (p_weight, p);
  if (pm)
    return lng_m + pm;
  return lng_m;
}


create procedure s_summary (inout row any)
{
  declare sorted, inx, tot any;
 tot := '';
 sorted := subseq (row, 3, row[1] + 3);
  for (inx := 0; inx < length (sorte); inx := inx + 3)
    sorted[inx + 2] := sum_o_p_score (sorted[inx], sorted[inx + 1]);
  gvector_sort (sorted, 3, 2, 0);
  for (inx := 0; inx < length (sorted); inx := inx + 3)
  tot	 := tot || rdf_box_data (sorted[inx]);
  return search_excerpt (text_exp, tot);
}


create procedure sum_result (inout final any, inout res any, inout text_exp any, inout s varchar, inout start_inx int, inout end_inx int, inout s_rank real)
{
  declare sorted, inx, tot, exc, elt, tsum any;
 tsum := 0;
 tot := '';
 sorted := subseq (res, start_inx, end_inx);
  for (inx := 0; inx < length (sorted); inx := inx + 3)
    {
      tsum := tsum + sorted[inx + 2];
      sorted[inx + 2] := sum_o_p_score (sorted[inx], sorted[inx + 1]);
    }
  --dbg_obj_print ('sorted = ', sorted);
  gvector_sort (sorted, 3, 2, 0);
  for (inx := 0; inx < length (sorted); inx := inx + 3)
  tot	 := tot || rdf_box_data (sorted[inx]);
 exc := search_excerpt (text_exp, tot);
  --dbg_obj_print (' summaries of ', tot, ' = ', exc);
 elt := xmlelement ('row', xmlelement ('col', s), xmlelement ('col', exc),
		    xmlelement ('col', cast (s_rank as varchar)),
		    xmlelement ('col', cast (cast (tsum as real) / ((end_inx - start_inx) / 3) as varchar)));
  xte_nodebld_xmlagg_acc (final, elt);
}


create procedure sum_final (inout x any)
{
  return xml_tree_doc (xte_nodebld_final_root (x));
}


create procedure s_sum_page (in rows any, in text_exp varchar)
{
  /* fill the os and translate the iris and make sums */
  declare inx, s, prev_s, prev_fill, fill, inx2, n, s_rank any;
  declare dp, os, so, res, final any;
 dp := dpipe (1, 'ID_TO_IRI', '__RO2SQ');
  xte_nodebld_init (final);
  for (inx := 0; inx < length (rows); inx := inx + 1)
    {
    os := aref (rows, inx, 1);;
      for (inx2 := 3; inx2 < os[1] + 3; inx2 := inx2 + 3)
	dpipe_input (dp, aref (rows, inx, 0), os[inx2]);
    }
  n := 3 * dpipe_count (dp);
  --dbg_obj_print ('result length ', n);
  res := make_array (n, 'any');  
  fill := 0;
  for (inx := 0; inx < length (rows); inx := inx + 1)
    {
      os := aref (rows, inx, 1);
      s_rank := rnk_scale (os[0]);
    prev_fill := fill;
      for (inx2 := 3; inx2 < os[1] + 3; inx2 := inx2 + 3)
	{
	so := dpipe_next (dp, 0);
	  --dbg_obj_print ('res ', fill, so);
	s := so[0];
	  res[fill] := so[1];
	    res[fill + 1] := os[inx2 + 1];
	      res[fill + 2] := os[inx2 + 2];
	fill := fill + 3;
	}
      sum_result (final, res, text_exp, s, prev_fill, fill, s_rank);
    }
  dpipe_next (dp, 1);
  sum_result (final, res, text_exp, s, prev_fill, fill, s_rank);
  return sum_final (final);
}


create procedure vt ()
{
  declare x any;
  x := vector ('a', 2, 'b', 1);
  gvector_sort (x, 2, 1, 1);
  --dbg_obj_print (x);
}

create procedure sum_tst (in text_exp varchar, in text_words varchar := null)
{
  declare res any;
  if  (text_words is null)
    text_words := vector (text_exp);
 res := (select vector_agg (vector (s, sm)) from 
  (select top 20 s, s_sum (iri_rank (s), p, o, score)  as sm from rdf_obj, rdf_ft, rdf_quad q1 where contains (ro_flags, text_exp) and rf_id = ro_id and q1.o = rf_o group by s 
   order by sum_rank (sm) option (quietcast) ) s option (quietcast));
  dbg_obj_print (res);
 res := s_sum_page (res, text_words);
  return res;
}

--  sum_tst ('oori');

--  sparql     select ?s1 as ?c1, <SHORT_OR_LONG::s_sum> (<SHORT_OR_LONG::IRI_RANK> (?s1), ?s1textp, ?o1, ?sc) as ?sm where { ?s1 ?s1textp ?o1 . ?o1 bif:contains  'NEW AND YORK'  option (score ?sc)  . } group by ?s1 order by desc <SHORT_OR_LONG::sum_rank> (?sm)  limit 20;
-- explain ('sparql     select ?s1 as ?c1, (<SHORT_OR_LONG::s_sum> (<SHORT_OR_LONG::IRI_RANK> (?s1), ?s1textp, ?o1, ?sc)) as ?sm where { ?s1 ?s1textp ?o1 . ?o1 bif:contains  ''NEW AND YORK''  option (score ?sc)  . } group by ?s1 order by desc (<SHORT_OR_LONG::sum_rank> (<SHORT_OR_LONG::s_sum> (<SHORT_OR_LONG::IRI_RANK> (?s1), ?s1textp, ?o1, ?sc)))  limit 20');
