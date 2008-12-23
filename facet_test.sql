
-- Sample facet queries 


<query> <class iri="http://xmlns.com/foaf/0.1/Person" /><view type="list" limit="10" /></query>


select fct_query (xtree_doc ('
<query> <class iri="http://xmlns.com/foaf/0.1/Person" />
<property iri="foaf:knows"><property iri="foaf:name"><value>"Joe"</value>  </property>
</property>
<view type="list" limit="10" /></query>
 '));

select fct_query (xtree_doc ('
<query> <class iri="http://xmlns.com/foaf/0.1/Person" />
<property iri="foaf:knows"><property iri="foaf:name"><value>"Joe"</value>  </property>
</property>
<view type="properties" limit="10" /></query>
 '));



select fct_query (xtree_doc ('
<query><text>semantic</text> <view type="text" limit="10" />
</query>'));






select fct_test ('
<query> <class iri="http://xmlns.com/foaf/0.1/Person" />
<view type="properties" limit="10" /></query>
 ', 1000);



select fct_query (xtree_doc ('<query><class iri="http://xmlns.com/foaf/0.1/Person"/> <view type="list" limit="10"/></query>'));

select fct_test  ('<query> <text>semantic web</text><view type="text" limit="20"/></query>');

select fct_test  ('<query> <text>hottie</text><view type="text-properties" limit="20"/></query>');

select fct_test  ('<query> <text property="http://purl.org/dc/elements/1.1/description">hottie</text><view type="text" limit="20"/></query>');
